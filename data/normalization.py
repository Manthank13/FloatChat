"""
Normalization and sanitization utilities for raw oceanographic ARGO observations.

Handles conversion of Julian dates, extraction of QC flags, variable unit mapping,
and sanitization of NaN, Inf, and FillValues.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from data.models import ArgoObservation

# Standard ARGO epoch reference: 1950-01-01 00:00:00 UTC
ARGO_EPOCH = datetime(1950, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

# Standard ARGO sentinel fill values indicating missing or invalid sensor data
SENTINEL_FILL_VALUES = {
    99999.0,
    9999.0,
    -999.0,
    -9999.0,
    1e36,
    -1e36,
}


def clean_numeric(
    val: Any,
    min_val: Optional[float] = None,
    max_val: Optional[float] = None,
    default: Optional[float] = None,
) -> Optional[float]:
    """
    Sanitize raw numeric sensor data, discarding NaN, Inf, and sentinel FillValues.
    """
    if val is None:
        return default
    try:
        f = float(val)
    except (ValueError, TypeError):
        return default

    if math.isnan(f) or math.isinf(f) or f in SENTINEL_FILL_VALUES:
        return default

    if min_val is not None and f < min_val:
        return default
    if max_val is not None and f > max_val:
        return default

    return round(f, 4)


def parse_qc_flag(qc_val: Any, default: int = 1) -> int:
    """
    Extract standard integer ARGO QC flag from character, byte, or numeric values.
    """
    if qc_val is None:
        return default
    try:
        if isinstance(qc_val, bytes):
            qc_val = qc_val.decode("utf-8", errors="ignore")
        if isinstance(qc_val, str):
            s = qc_val.strip()
            if not s or s == " ":
                return default
            return int(s[0])
        return int(qc_val)
    except (ValueError, TypeError):
        return default


def convert_argo_juld_to_iso(juld_days: float, epoch: datetime = ARGO_EPOCH) -> str:
    """
    Convert ARGO Julian days relative to 1950-01-01 UTC to ISO 8601 string.
    """
    if math.isnan(juld_days) or juld_days < 0:
        return "1950-01-01T00:00:00Z"
    dt = epoch + timedelta(days=juld_days)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def normalize_observation_dict(
    raw: Dict[str, Any],
    data_source: str = "REAL_ARGO_DATA",
) -> Optional[ArgoObservation]:
    """
    Convert raw dictionary representation from NetCDF, Parquet, or REST API into a typed ArgoObservation.
    
    Returns None if mandatory geographic coordinates or pressure/depth are invalid.
    """
    # 1. Platform ID
    platform_id = str(
        raw.get("platform_id")
        or raw.get("PLATFORM_NUMBER")
        or raw.get("platform_number")
        or raw.get("wmo")
        or "UNKNOWN"
    ).strip()

    # 2. Coordinates
    lat = clean_numeric(
        raw.get("latitude") or raw.get("LATITUDE") or raw.get("lat"),
        min_val=-90.0,
        max_val=90.0,
    )
    lon = clean_numeric(
        raw.get("longitude") or raw.get("LONGITUDE") or raw.get("lon"),
        min_val=-180.0,
        max_val=180.0,
    )
    if lat is None or lon is None:
        return None

    # 3. Pressure & Depth
    pres = clean_numeric(
        raw.get("pressure_dbar")
        or raw.get("PRES_ADJUSTED")
        or raw.get("PRES")
        or raw.get("pressure")
        or raw.get("pres"),
        min_val=0.0,
        max_val=12000.0,
    )
    depth = clean_numeric(
        raw.get("depth_m") or raw.get("depth") or raw.get("DEPTH"),
        min_val=0.0,
        max_val=12000.0,
    )

    if depth is None and pres is not None:
        # Approximate depth from pressure: 1 dbar ≈ 0.993 meters in sea water
        depth = round(pres * 0.993, 2)
    elif pres is None and depth is not None:
        pres = round(depth / 0.993, 2)

    if depth is None or pres is None:
        return None

    # 4. Timestamp
    ts = raw.get("timestamp") or raw.get("date") or raw.get("time") or raw.get("DATE")
    if not ts and "JULD" in raw:
        juld_val = clean_numeric(raw.get("JULD"))
        ts = convert_argo_juld_to_iso(juld_val) if juld_val is not None else "2025-01-01T00:00:00Z"
    elif not ts:
        ts = "2025-01-01T00:00:00Z"
    elif isinstance(ts, datetime):
        ts = ts.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 5. Core Variables & QC
    temp = clean_numeric(
        raw.get("temp_c")
        or raw.get("TEMP_ADJUSTED")
        or raw.get("TEMP")
        or raw.get("temperature")
        or raw.get("temp"),
        min_val=-3.0,
        max_val=45.0,
    )
    psal = clean_numeric(
        raw.get("psal_psu")
        or raw.get("PSAL_ADJUSTED")
        or raw.get("PSAL")
        or raw.get("salinity")
        or raw.get("psal"),
        min_val=0.0,
        max_val=45.0,
    )

    # 6. Biogeochemical Variables
    doxy = clean_numeric(
        raw.get("doxy_umol_kg")
        or raw.get("DOXY_ADJUSTED")
        or raw.get("DOXY")
        or raw.get("oxygen")
        or raw.get("doxy"),
        min_val=0.0,
        max_val=600.0,
    )
    chla = clean_numeric(
        raw.get("chla_mg_m3") or raw.get("CHLA_ADJUSTED") or raw.get("CHLA") or raw.get("chla"),
        min_val=0.0,
        max_val=100.0,
    )
    nitrate = clean_numeric(
        raw.get("nitrate_umol_kg") or raw.get("NITRATE_ADJUSTED") or raw.get("NITRATE"),
        min_val=0.0,
        max_val=100.0,
    )
    ph = clean_numeric(
        raw.get("ph_in_situ") or raw.get("PH_IN_SITU_TOTAL_ADJUSTED") or raw.get("PH_IN_SITU_TOTAL"),
        min_val=6.0,
        max_val=9.0,
    )

    # 7. QC Flags
    temp_qc = parse_qc_flag(raw.get("temp_qc") or raw.get("TEMP_ADJUSTED_QC") or raw.get("TEMP_QC"), default=1)
    psal_qc = parse_qc_flag(raw.get("psal_qc") or raw.get("PSAL_ADJUSTED_QC") or raw.get("PSAL_QC"), default=1)
    doxy_qc = parse_qc_flag(raw.get("doxy_qc") or raw.get("DOXY_ADJUSTED_QC") or raw.get("DOXY_QC"), default=1) if doxy is not None else None

    cycle_num = raw.get("cycle_number") or raw.get("CYCLE_NUMBER") or raw.get("cycle")
    cycle = int(cycle_num) if cycle_num is not None and str(cycle_num).isdigit() else None

    return ArgoObservation(
        platform_id=platform_id,
        cycle_number=cycle,
        latitude=lat,
        longitude=lon,
        timestamp=str(ts),
        pressure_dbar=pres,
        depth_m=depth,
        temp_c=temp,
        psal_psu=psal,
        doxy_umol_kg=doxy,
        chla_mg_m3=chla,
        nitrate_umol_kg=nitrate,
        ph_in_situ=ph,
        temp_qc=temp_qc,
        psal_qc=psal_qc,
        doxy_qc=doxy_qc,
        data_source=data_source,
    )
