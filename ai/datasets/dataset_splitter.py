"""
Dataset Splitter
================
Implements cyclone-event-based train/val/test splits.

IMPORTANT: Random splitting is NOT used because images from the same cyclone
event are temporally correlated. Using random split would cause data leakage
where the same storm appears in both train and test sets.

Strategy: Time-based split by cyclone start year.
  - Train: storms starting in years <= train_end_year
  - Val:   storms starting in years > train_end_year and <= val_end_year
  - Test:  storms starting in years > val_end_year

This is documented in docs/ML_METHODOLOGY.md.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd

logger = logging.getLogger(__name__)


def split_by_year(
    storms_df: pd.DataFrame,
    train_end_year: int = 2010,
    val_end_year: int = 2013,
    year_col: str = "YEAR",
    sid_col: str = "SID",
) -> Tuple[List[str], List[str], List[str]]:
    """
    Split storm IDs into train/val/test sets by year.

    Args:
        storms_df: DataFrame with one row per storm (from IBTrACSLoader.get_storm_list()).
        train_end_year: Last year inclusive for training set.
        val_end_year: Last year inclusive for validation set.
        year_col: Column name for storm year.
        sid_col: Column name for storm ID.

    Returns:
        (train_sids, val_sids, test_sids) — lists of storm ID strings.
    """
    train_sids = storms_df[storms_df[year_col] <= train_end_year][sid_col].tolist()
    val_sids = storms_df[
        (storms_df[year_col] > train_end_year) &
        (storms_df[year_col] <= val_end_year)
    ][sid_col].tolist()
    test_sids = storms_df[storms_df[year_col] > val_end_year][sid_col].tolist()

    logger.info(
        f"Split by year: Train={len(train_sids)} ({train_end_year} and earlier), "
        f"Val={len(val_sids)} ({train_end_year+1}–{val_end_year}), "
        f"Test={len(test_sids)} ({val_end_year+1}+)"
    )
    return train_sids, val_sids, test_sids


def filter_files_by_sids(
    file_paths: List[str],
    storm_sids: List[str],
) -> List[str]:
    """
    Filter a list of HURSAT file paths to only include files for specific storm IDs.

    Assumes HURSAT filenames contain the storm SID.
    Example filename: HURSAT-B1_v06_2023292N08067_202306100000.nc

    Args:
        file_paths: All HURSAT NetCDF file paths.
        storm_sids: Storm IDs to include.

    Returns:
        Filtered list of file paths.
    """
    sid_set = set(storm_sids)
    filtered = []
    for fp in file_paths:
        stem = Path(fp).stem
        # Try to find SID in filename
        for sid in sid_set:
            if sid in stem:
                filtered.append(fp)
                break
    return filtered


def get_split_statistics(
    train_sids: List[str],
    val_sids: List[str],
    test_sids: List[str],
    storms_df: pd.DataFrame,
    sid_col: str = "SID",
) -> Dict:
    """
    Return statistics about the dataset split.

    Args:
        train_sids, val_sids, test_sids: Storm ID lists.
        storms_df: Full storm summary DataFrame.
        sid_col: Storm ID column name.

    Returns:
        dict with split statistics.
    """
    def compute_stats(sids: List[str]) -> Dict:
        subset = storms_df[storms_df[sid_col].isin(sids)]
        if subset.empty:
            return {"count": 0}
        stats = {
            "count": len(subset),
            "year_range": f"{subset['YEAR'].min()}–{subset['YEAR'].max()}" if "YEAR" in subset else "N/A",
            "basins": subset["BASIN"].value_counts().to_dict() if "BASIN" in subset else {},
        }
        if "PEAK_INTENSITY" in subset:
            stats["intensity_dist"] = subset["PEAK_INTENSITY"].value_counts().to_dict()
        return stats

    return {
        "train": compute_stats(train_sids),
        "val": compute_stats(val_sids),
        "test": compute_stats(test_sids),
        "total_storms": len(train_sids) + len(val_sids) + len(test_sids),
        "split_strategy": "cyclone_event_year_based",
        "data_leakage_prevention": "Same storm cannot appear in both train and test",
    }


def export_split_manifest(
    train_sids: List[str],
    val_sids: List[str],
    test_sids: List[str],
    output_dir: str = "data/labels",
) -> None:
    """
    Save split manifests as CSV files.

    Args:
        train_sids, val_sids, test_sids: Storm ID lists.
        output_dir: Directory to save manifest files.
    """
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    pd.DataFrame({"SID": train_sids, "split": "train"}).to_csv(
        output / "split_train.csv", index=False
    )
    pd.DataFrame({"SID": val_sids, "split": "val"}).to_csv(
        output / "split_val.csv", index=False
    )
    pd.DataFrame({"SID": test_sids, "split": "test"}).to_csv(
        output / "split_test.csv", index=False
    )
    logger.info(f"Split manifests saved to: {output}/")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Dataset splitter module loaded.")
    print("Import and use split_by_year() with IBTrACS storm list.")
