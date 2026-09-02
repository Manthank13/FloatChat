import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.core.logging import logger
from app.models.argo import FloatMetadata, Observation, Profile


class ArgoNormalizer:
    """Utility layer to clean, validate, and normalize raw Argo provider data into domain models."""

    OCEAN_FILL_VALUES = {-9999.0, 9999.0, 99999.0, -999.0, 999.0, -99.0}

    @classmethod
    def clean_float_val(cls, val: Any) -> Optional[float]:
        """Parses float values, converting NaNs, infinite, missing or ocean fill values to None."""
        if val is None:
            return None
        try:
            if isinstance(val, str):
                if val.strip().lower() in ("nan", "none", "null", ""):
                    return None
                val = float(val.strip())
            f_val = float(val)
            if math.isnan(f_val) or math.isinf(f_val) or f_val in cls.OCEAN_FILL_VALUES:
                return None
            return f_val
        except (ValueError, TypeError):
            return None

    @classmethod
    def clean_int_val(cls, val: Any) -> Optional[int]:
        """Parses integer values safely."""
        f_val = cls.clean_float_val(val)
        if f_val is not None:
            return int(f_val)
        return None

    @classmethod
    def parse_datetime(cls, dt_str: Any) -> datetime:
        """Parses string or numeric timestamp to timezone-aware UTC datetime."""
        if isinstance(dt_str, datetime):
            return dt_str if dt_str.tzinfo else dt_str.replace(tzinfo=timezone.utc)

        if not dt_str or not isinstance(dt_str, str):
            return datetime.now(timezone.utc)

        dt_cleaned = dt_str.strip().replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(dt_cleaned)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            logger.warning(f"Could not parse timestamp '{dt_str}', defaulting to current UTC time")
            return datetime.now(timezone.utc)

    @classmethod
    def derive_depth(cls, pressure: Optional[float]) -> Optional[float]:
        """Derives depth in meters from pressure in decibars using standard approximation (1 dbar ≈ 0.993 m)."""
        if pressure is None or pressure < 0:
            return None
        return round(pressure * 0.993, 2)

    @classmethod
    def validate_temperature(cls, temp: Optional[float]) -> Optional[float]:
        """Validates sea temperature within realistic ocean bounds (-5.0°C to 40.0°C)."""
        if temp is None:
            return None
        if -5.0 <= temp <= 40.0:
            return round(temp, 3)
        logger.debug(f"Discarded out-of-range temperature value: {temp}")
        return None

    @classmethod
    def validate_salinity(cls, psal: Optional[float]) -> Optional[float]:
        """Validates practical salinity within physical ocean bounds (0.0 to 50.0 PSU)."""
        if psal is None:
            return None
        if 0.0 <= psal <= 50.0:
            return round(psal, 3)
        logger.debug(f"Discarded out-of-range salinity value: {psal}")
        return None

    @classmethod
    def normalize_observation(
        cls,
        raw: Dict[str, Any],
        is_mock: bool = False,
        data_source: str = "argo_gdac",
    ) -> Optional[Observation]:
        """Normalizes a single raw observation record."""
        float_id = str(raw.get("platform_number") or raw.get("float_id") or "UNKNOWN").strip()
        lat = cls.clean_float_val(raw.get("latitude") or raw.get("lat"))
        lon = cls.clean_float_val(raw.get("longitude") or raw.get("lon"))

        if lat is None or not (-90.0 <= lat <= 90.0):
            return None
        if lon is None or not (-180.0 <= lon <= 180.0):
            return None

        dt = cls.parse_datetime(raw.get("time") or raw.get("timestamp"))

        pres = cls.clean_float_val(raw.get("pres") or raw.get("pressure"))
        if pres is not None and pres < 0:
            pres = None

        temp = cls.validate_temperature(cls.clean_float_val(raw.get("temp") or raw.get("temperature")))
        psal = cls.validate_salinity(cls.clean_float_val(raw.get("psal") or raw.get("salinity")))
        depth = cls.clean_float_val(raw.get("depth")) or cls.derive_depth(pres)

        qc_flags = {}
        for qc_key in ("pres_qc", "temp_qc", "psal_qc"):
            if qc_key in raw and raw[qc_key] is not None:
                qc_flags[qc_key] = str(raw[qc_key])

        return Observation(
            float_id=float_id,
            timestamp=dt,
            latitude=lat,
            longitude=lon,
            pressure=pres,
            depth=depth,
            temperature=temp,
            salinity=psal,
            qc_flags=qc_flags,
            is_mock=is_mock,
            data_source=data_source,
        )

    @classmethod
    def normalize_erddap_table(
        cls,
        table_data: Dict[str, Any],
        is_mock: bool = False,
        data_source: str = "erddap_ifremer",
    ) -> List[Profile]:
        """Converts raw ERDDAP JSON response table into normalized Profile domain models."""
        column_names = table_data.get("columnNames", [])
        rows = table_data.get("rows", [])

        if not column_names or not rows:
            return []

        col_map = {name: idx for idx, name in enumerate(column_names)}

        # Group observations by profile key: (float_id, cycle_number, timestamp_str)
        profile_groups: Dict[Tuple[str, Optional[int], str], List[Observation]] = {}
        profile_meta: Dict[Tuple[str, Optional[int], str], Dict[str, Any]] = {}

        for row in rows:
            raw_dict = {col: row[idx] for col, idx in col_map.items() if idx < len(row)}
            obs = cls.normalize_observation(raw_dict, is_mock=is_mock, data_source=data_source)
            if not obs:
                continue

            cycle_num = cls.clean_int_val(raw_dict.get("cycle_number"))
            time_str = str(raw_dict.get("time"))
            key = (obs.float_id, cycle_num, time_str)

            if key not in profile_groups:
                profile_groups[key] = []
                profile_meta[key] = {
                    "float_id": obs.float_id,
                    "cycle_number": cycle_num,
                    "timestamp": obs.timestamp,
                    "latitude": obs.latitude,
                    "longitude": obs.longitude,
                }
            profile_groups[key].append(obs)

        profiles: List[Profile] = []
        for key, obs_list in profile_groups.items():
            meta = profile_meta[key]

            # Deduplicate observations by depth/pressure level
            seen_levels = set()
            unique_obs = []
            for obs in obs_list:
                level_key = obs.pressure if obs.pressure is not None else obs.depth
                if level_key is not None and level_key in seen_levels:
                    continue
                if level_key is not None:
                    seen_levels.add(level_key)
                unique_obs.append(obs)

            # Sort profile observations by depth/pressure ascending
            unique_obs.sort(key=lambda x: x.pressure if x.pressure is not None else (x.depth or 0.0))

            profiles.append(
                Profile(
                    float_id=meta["float_id"],
                    cycle_number=meta["cycle_number"],
                    timestamp=meta["timestamp"],
                    latitude=meta["latitude"],
                    longitude=meta["longitude"],
                    observations=unique_obs,
                    observation_count=len(unique_obs),
                    is_mock=is_mock,
                    data_source=data_source,
                )
            )

        return profiles
