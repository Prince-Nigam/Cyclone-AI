"""
Real-Time Data API
==================
Endpoints for live cyclone tracking and ocean weather data.

  GET /api/v1/realtime/cyclones   — Active cyclones from GDACS RSS
  GET /api/v1/realtime/weather    — Current weather at any lat/lon
  GET /api/v1/realtime/ocean-grid — 12 Indian Ocean monitoring points
  GET /api/v1/realtime/status     — Cache / health status

Data source labels:
  OBSERVED — real data from external agencies (GDACS, Open-Meteo)
  NOT predictions — no ML involved here
"""

from fastapi import APIRouter, Query
from app.schemas.cyclone import APIResponse
from app.services.realtime_service import (
    fetch_gdacs_cyclones,
    fetch_weather_point,
    fetch_ocean_grid,
    get_cache_info,
    get_live_telemetry_stream,
)

router = APIRouter(prefix="/realtime", tags=["Real-Time Data"])


@router.get("/cyclones", response_model=APIResponse)
def get_realtime_cyclones(
    indian_ocean_only: bool = Query(
        False,
        description="Set true to return only NI/SI basin cyclones"
    ),
):
    """
    Return currently active tropical cyclones worldwide (or Indian Ocean only).

    **Source**: GDACS (Global Disaster Alert and Coordination System)  
    **Update**: ~5 min on source; cached 15 min here  
    **Data type**: OBSERVED — not an ML prediction  
    **Disclaimer**: For official warnings visit [imd.gov.in](https://imd.gov.in)
    """
    cyclones = fetch_gdacs_cyclones(indian_ocean_only=indian_ocean_only)
    return APIResponse(
        success=True,
        data={
            "cyclones":      cyclones,
            "total":         len(cyclones),
            "source":        "GDACS",
            "data_type":     "OBSERVED",
            "indian_ocean":  indian_ocean_only,
            "disclaimer":    (
                "⚠️ OBSERVED data from GDACS. "
                "For official IMD alerts visit imd.gov.in"
            ),
        },
    )


@router.get("/weather", response_model=APIResponse)
def get_realtime_weather(
    lat: float = Query(..., ge=-90,  le=90,  description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    """
    Return current weather at any (lat, lon).

    **Source**: Open-Meteo (free, no API key)  
    **Fields**: wind_kt, wind_dir_deg, pressure_hpa, temp_c, humidity_pct  
    **Cache**: 15 minutes
    """
    result = fetch_weather_point(lat, lon)
    if result is None:
        return APIResponse(
            success=False,
            data=None,
            message="Weather fetch failed. Open-Meteo may be unreachable.",
        )
    return APIResponse(success=True, data=result)


@router.get("/ocean-grid", response_model=APIResponse)
def get_ocean_grid():
    """
    Return current weather for 12 predefined Indian Ocean monitoring points.

    Covers Arabian Sea, Bay of Bengal, Maldives, Andaman Sea.  
    **Source**: Open-Meteo — **Cache**: 15 minutes
    """
    grid = fetch_ocean_grid()
    return APIResponse(
        success=True,
        data={
            "points":    grid,
            "total":     len(grid),
            "source":    "Open-Meteo",
            "data_type": "OBSERVED",
        },
    )


@router.get("/status", response_model=APIResponse)
def get_realtime_status():
    """Cache and connectivity debug endpoint."""
    return APIResponse(
        success=True,
        data={
            "cache":    get_cache_info(),
            "sources":  {
                "gdacs":       "https://www.gdacs.org/xml/rss.xml",
                "open_meteo":  "https://api.open-meteo.com/v1/forecast",
            },
        },
    )


@router.get("/live-feed", response_model=APIResponse)
def get_realtime_live_feed():
    """
    Second-by-second live telemetry stream endpoint.
    Emits current UTC second timestamp, instant wind speed with micro-fluctuations,
    and live cyclone counts.
    """
    stream_data = get_live_telemetry_stream()
    return APIResponse(
        success=True,
        data=stream_data,
    )

