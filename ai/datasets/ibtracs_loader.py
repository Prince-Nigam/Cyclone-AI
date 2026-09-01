"""
IBTrACS Data Loader
===================
Loads and processes the International Best Track Archive for Climate Stewardship (IBTrACS).

Data source: https://www.ncei.noaa.gov/products/international-best-track-archive
License: Public Domain (NOAA)

This module parses IBTrACS CSV files and produces clean DataFrames for:
  - Cyclone track records
  - Intensity labels for classification/regression
  - Train/Val/Test splits by cyclone event (NOT random)

All data from IBTrACS is labeled as: data_type = "HISTORICAL"
"""

import logging
import os
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ── Saffir-Simpson mapping from IBTrACS USA_SSHS codes ──────────────────────
SSHS_TO_CLASS = {
    -5: "TD",         # Tropical Depression
    -4: "TS",         # Tropical Storm
    -3: "TS",         # Subtropical storm (map to TS)
    -2: "TD",         # Subtropical depression
    -1: "TD",         # Extratropical (map to TD as fallback)
     0: "TD",         # Tropical cyclone <TD strength
     1: "CAT1",
     2: "CAT2",
     3: "CAT3_PLUS",
     4: "CAT3_PLUS",
     5: "CAT3_PLUS",
}

CLASS_TO_IDX = {"TD": 0, "TS": 1, "CAT1": 2, "CAT2": 3, "CAT3_PLUS": 4}
IDX_TO_CLASS = {v: k for k, v in CLASS_TO_IDX.items()}

# Wind speed thresholds for classification (kt) — from Saffir-Simpson scale
WIND_TO_CLASS_THRESHOLDS = [
    (0,   34,  "TD"),
    (34,  64,  "TS"),
    (64,  83,  "CAT1"),
    (83,  96,  "CAT2"),
    (96, 999,  "CAT3_PLUS"),
]

# IBTrACS column names we use
IBTRACS_COLS = [
    "SID", "SEASON", "NUMBER", "BASIN", "SUBBASIN",
    "NAME", "ISO_TIME", "NATURE",
    "LAT", "LON",
    "WMO_WIND", "WMO_PRES",
    "USA_WIND", "USA_PRES", "USA_SSHS",
    "USA_STATUS",
]

# Basins of interest (NI = North Indian Ocean)
INDIAN_OCEAN_BASINS = ["NI"]  # BB = Bay of Bengal, AS = Arabian Sea (subbasin)
ALL_BASINS = ["NI", "EP", "NA", "WP", "SP", "SI"]


class IBTrACSLoader:
    """
    Loads and preprocesses IBTrACS best-track data.

    Usage:
        loader = IBTrACSLoader(csv_path="data/raw/ibtracs.NI.list.v04r00.csv")
        df = loader.load()
        storms = loader.get_storm_list()
        track = loader.get_storm_track("2023292N08067")
    """

    def __init__(
        self,
        csv_path: str,
        basin_filter: Optional[list] = None,
        min_duration_hours: int = 12,
        min_wind_kt: float = 0.0,
    ):
        """
        Args:
            csv_path: Path to IBTrACS CSV file.
            basin_filter: List of basin codes to include. None = all basins.
            min_duration_hours: Minimum storm duration to include.
            min_wind_kt: Minimum peak wind speed (kt) to include.
        """
        self.csv_path = Path(csv_path)
        self.basin_filter = basin_filter
        self.min_duration_hours = min_duration_hours
        self.min_wind_kt = min_wind_kt
        self._df: Optional[pd.DataFrame] = None

    def load(self) -> pd.DataFrame:
        """
        Load and clean IBTrACS CSV.

        Returns:
            DataFrame with one row per time step per storm.
            Columns include SID, NAME, ISO_TIME, LAT, LON,
            WIND_KT, PRESSURE_HPA, INTENSITY_CLASS.
        """
        if not self.csv_path.exists():
            raise FileNotFoundError(
                f"IBTrACS file not found: {self.csv_path}\n"
                f"Download from: https://www.ncei.noaa.gov/products/"
                f"international-best-track-archive"
            )

        logger.info(f"Loading IBTrACS data from: {self.csv_path}")

        # IBTrACS CSV has two header rows; skip first row (units)
        df = pd.read_csv(
            self.csv_path,
            skiprows=[1],
            low_memory=False,
            na_values=[" ", ""],
        )

        logger.info(f"Raw records loaded: {len(df)}")

        df = self._clean(df)
        df = self._filter(df)
        df = self._assign_labels(df)
        df = self._add_derived_features(df)

        self._df = df
        logger.info(f"Processed records: {len(df)} from {df['SID'].nunique()} storms")
        return df

    def _clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize column names and types."""
        # Keep only columns we need (handle missing columns gracefully)
        available = [c for c in IBTRACS_COLS if c in df.columns]
        df = df[available].copy()

        # Parse timestamp
        df["ISO_TIME"] = pd.to_datetime(df["ISO_TIME"], errors="coerce", utc=True)
        df = df.dropna(subset=["ISO_TIME"])

        # Numeric columns
        for col in ["LAT", "LON", "WMO_WIND", "WMO_PRES", "USA_WIND", "USA_PRES", "USA_SSHS"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Standardize basin
        if "BASIN" in df.columns:
            df["BASIN"] = df["BASIN"].str.strip().str.upper()

        # Standardize name
        if "NAME" in df.columns:
            df["NAME"] = df["NAME"].str.strip().str.upper()
            df["NAME"] = df["NAME"].replace("UNNAMED", "UNNAMED")

        # Create unified wind / pressure columns (prefer USA, fallback to WMO)
        df["WIND_KT"] = df.get("USA_WIND", pd.Series(dtype=float))
        if "WMO_WIND" in df.columns:
            df["WIND_KT"] = df["WIND_KT"].fillna(df["WMO_WIND"])

        df["PRESSURE_HPA"] = df.get("USA_PRES", pd.Series(dtype=float))
        if "WMO_PRES" in df.columns:
            df["PRESSURE_HPA"] = df["PRESSURE_HPA"].fillna(df["WMO_PRES"])

        # Sort by storm and time
        df = df.sort_values(["SID", "ISO_TIME"]).reset_index(drop=True)

        return df

    def _filter(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply basin and quality filters."""
        # Basin filter
        if self.basin_filter and "BASIN" in df.columns:
            df = df[df["BASIN"].isin(self.basin_filter)]
            logger.info(f"After basin filter {self.basin_filter}: {len(df)} records")

        # Remove rows with missing coordinates
        df = df.dropna(subset=["LAT", "LON"])

        # Valid coordinate range
        df = df[(df["LAT"] >= -90) & (df["LAT"] <= 90)]
        df = df[(df["LON"] >= -180) & (df["LON"] <= 180)]

        return df

    def _assign_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Assign intensity class labels.

        Priority:
        1. Use USA_SSHS if available
        2. Fallback: derive from WIND_KT thresholds
        """
        def classify_wind(wind_kt: float) -> str:
            if pd.isna(wind_kt):
                return "UNKNOWN"
            for lo, hi, label in WIND_TO_CLASS_THRESHOLDS:
                if lo <= wind_kt < hi:
                    return label
            return "UNKNOWN"

        def classify_sshs(sshs: float) -> str:
            if pd.isna(sshs):
                return None
            return SSHS_TO_CLASS.get(int(sshs))

        # Try SSHS first
        if "USA_SSHS" in df.columns:
            df["INTENSITY_CLASS"] = df["USA_SSHS"].apply(classify_sshs)
        else:
            df["INTENSITY_CLASS"] = "UNKNOWN"

        # Fill missing SSHS labels with wind-based classification
        mask = df["INTENSITY_CLASS"].isna() | (df["INTENSITY_CLASS"] == "UNKNOWN")
        df.loc[mask, "INTENSITY_CLASS"] = df.loc[mask, "WIND_KT"].apply(classify_wind)

        # Map class to numeric index
        df["CLASS_IDX"] = df["INTENSITY_CLASS"].map(CLASS_TO_IDX)

        # Data type label — IBTrACS is always historical
        df["DATA_TYPE"] = "HISTORICAL"

        return df

    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived features for ML input."""
        # Time features
        df["YEAR"] = df["ISO_TIME"].dt.year
        df["MONTH"] = df["ISO_TIME"].dt.month
        df["DAY_OF_YEAR"] = df["ISO_TIME"].dt.dayofyear
        df["HOUR"] = df["ISO_TIME"].dt.hour

        # Per-storm movement features (forward differences)
        df = df.sort_values(["SID", "ISO_TIME"])
        grp = df.groupby("SID")

        df["LAT_PREV"] = grp["LAT"].shift(1)
        df["LON_PREV"] = grp["LON"].shift(1)
        df["DLAT"] = df["LAT"] - df["LAT_PREV"]
        df["DLON"] = df["LON"] - df["LON_PREV"]

        # Approximate speed (degrees/step)
        df["SPEED_DEG"] = np.sqrt(df["DLAT"] ** 2 + df["DLON"] ** 2)

        return df

    def get_storm_list(self) -> pd.DataFrame:
        """
        Return a summary DataFrame with one row per storm.
        Includes: SID, NAME, BASIN, start_time, end_time, peak_wind, peak_intensity.
        """
        if self._df is None:
            raise RuntimeError("Call load() first.")

        def storm_summary(grp):
            return pd.Series({
                "NAME": grp["NAME"].iloc[0] if "NAME" in grp else "UNNAMED",
                "BASIN": grp["BASIN"].iloc[0] if "BASIN" in grp else "UNK",
                "START_TIME": grp["ISO_TIME"].min(),
                "END_TIME": grp["ISO_TIME"].max(),
                "DURATION_HOURS": (
                    grp["ISO_TIME"].max() - grp["ISO_TIME"].min()
                ).total_seconds() / 3600,
                "PEAK_WIND_KT": grp["WIND_KT"].max(),
                "MIN_PRESSURE_HPA": grp["PRESSURE_HPA"].min(),
                "PEAK_INTENSITY": grp.loc[
                    grp["WIND_KT"].idxmax(), "INTENSITY_CLASS"
                ] if not grp["WIND_KT"].isna().all() else "UNKNOWN",
                "NUM_OBSERVATIONS": len(grp),
                "YEAR": grp["YEAR"].iloc[0],
                "DATA_TYPE": "HISTORICAL",
            })

        storms = self._df.groupby("SID").apply(storm_summary).reset_index()

        # Filter by minimum duration
        storms = storms[storms["DURATION_HOURS"] >= self.min_duration_hours]

        # Filter by minimum peak wind
        if self.min_wind_kt > 0:
            storms = storms[storms["PEAK_WIND_KT"] >= self.min_wind_kt]

        logger.info(f"Storm list: {len(storms)} qualifying storms")
        return storms

    def get_storm_track(self, storm_id: str) -> pd.DataFrame:
        """
        Get track records for a specific storm.

        Args:
            storm_id: IBTrACS SID (e.g., '2023292N08067')

        Returns:
            DataFrame with time-ordered track points.
        """
        if self._df is None:
            raise RuntimeError("Call load() first.")

        track = self._df[self._df["SID"] == storm_id].copy()
        if track.empty:
            raise ValueError(f"Storm ID '{storm_id}' not found in dataset.")

        return track.sort_values("ISO_TIME").reset_index(drop=True)

    def get_train_val_test_split(
        self,
        train_end_year: int = 2010,
        val_end_year: int = 2013,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split by cyclone event year — NOT random split.

        This prevents data leakage where images from the same storm
        appear in both train and test sets.

        Args:
            train_end_year: Last year (inclusive) for training.
            val_end_year: Last year (inclusive) for validation.

        Returns:
            (train_df, val_df, test_df) DataFrames.
        """
        if self._df is None:
            raise RuntimeError("Call load() first.")

        train = self._df[self._df["YEAR"] <= train_end_year]
        val = self._df[
            (self._df["YEAR"] > train_end_year) &
            (self._df["YEAR"] <= val_end_year)
        ]
        test = self._df[self._df["YEAR"] > val_end_year]

        logger.info(
            f"Split: Train={len(train['SID'].unique())} storms, "
            f"Val={len(val['SID'].unique())} storms, "
            f"Test={len(test['SID'].unique())} storms"
        )
        return train, val, test

    def export_metadata(self, output_path: str) -> None:
        """Export metadata CSV for the data/metadata directory."""
        if self._df is None:
            raise RuntimeError("Call load() first.")

        storms = self.get_storm_list()
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)
        storms.to_csv(output, index=False)
        logger.info(f"Metadata exported to: {output}")


def wind_kt_to_class(wind_kt: float) -> str:
    """Utility: convert wind speed (kt) to intensity class label."""
    for lo, hi, label in WIND_TO_CLASS_THRESHOLDS:
        if lo <= wind_kt < hi:
            return label
    return "UNKNOWN"


def class_to_idx(class_label: str) -> int:
    """Utility: convert class label to integer index."""
    return CLASS_TO_IDX.get(class_label, -1)


def idx_to_class(idx: int) -> str:
    """Utility: convert integer index to class label."""
    return IDX_TO_CLASS.get(idx, "UNKNOWN")


if __name__ == "__main__":
    # Quick test — run from project root
    logging.basicConfig(level=logging.INFO)

    sample_path = "data/raw/ibtracs.NI.list.v04r00.csv"
    if not Path(sample_path).exists():
        print(f"IBTrACS file not found at {sample_path}")
        print("Download from: https://www.ncei.noaa.gov/products/international-best-track-archive")
    else:
        loader = IBTrACSLoader(csv_path=sample_path, basin_filter=["NI"])
        df = loader.load()
        storms = loader.get_storm_list()
        print(f"\nLoaded {len(storms)} storms from North Indian Ocean")
        print(storms[["SID", "NAME", "YEAR", "PEAK_WIND_KT", "PEAK_INTENSITY"]].head(10))
