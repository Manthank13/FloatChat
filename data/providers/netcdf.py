"""
NetCDF ARGO Data Provider for FloatChat.

Reads and parses standard ARGO GDAC profile NetCDF files (*_prof.nc) or directories of NetCDF files.
Extracts oceanographic variables, handles FillValues, and normalizes coordinates and timestamps.
"""

import glob
import logging
import os
from typing import Any, Dict, List, Optional

from data.models import ArgoObservation
from data.normalization import normalize_observation_dict
from data.providers.base import BaseArgoProvider

logger = logging.getLogger(__name__)


class NetCDFArgoProvider(BaseArgoProvider):
    """
    ARGO Data Provider capable of reading standard GDAC NetCDF float profile files.
    """

    def __init__(self, file_path_or_dir: Optional[str] = None):
        super().__init__(name="NETCDF_ARGO_PROVIDER")
        self.path = file_path_or_dir or os.environ.get("ARGO_DATA_PATH", "")

    def load_observations(self) -> List[ArgoObservation]:
        """Load and normalize observations from configured NetCDF path or directory."""
        if not self.path or not os.path.exists(self.path):
            logger.info("NetCDF data path '%s' not configured or does not exist.", self.path)
            return []

        # Find files
        if os.path.isdir(self.path):
            nc_files = glob.glob(os.path.join(self.path, "**", "*.nc"), recursive=True)
        else:
            nc_files = [self.path]

        if not nc_files:
            return []

        observations: List[ArgoObservation] = []

        try:
            import netCDF4 as nc
            for fpath in nc_files:
                obs_from_file = self._parse_netcdf_file(fpath, nc)
                observations.extend(obs_from_file)
        except ImportError:
            logger.warning("netCDF4 package not installed. Cannot parse NetCDF files directly.")
            return []

        return observations

    def _parse_netcdf_file(self, file_path: str, nc_module: Any) -> List[ArgoObservation]:
        """Parse individual ARGO NetCDF profile file."""
        observations: List[ArgoObservation] = []
        try:
            with nc_module.Dataset(file_path, "r") as ds:
                # Extract float metadata
                plat_num = ds.variables.get("PLATFORM_NUMBER")
                platform_id = "UNKNOWN"
                if plat_num is not None:
                    raw_plat = plat_num[:]
                    if hasattr(raw_plat, "tobytes"):
                        platform_id = raw_plat.tobytes().decode("utf-8", errors="ignore").strip()
                    elif isinstance(raw_plat, (list, tuple)):
                        platform_id = str(raw_plat[0]).strip()
                    else:
                        platform_id = str(raw_plat).strip()

                lat_var = ds.variables.get("LATITUDE")
                lon_var = ds.variables.get("LONGITUDE")
                juld_var = ds.variables.get("JULD")
                cycle_var = ds.variables.get("CYCLE_NUMBER")

                # Core Variables: prefer ADJUSTED over raw
                pres_var = ds.variables.get("PRES_ADJUSTED") or ds.variables.get("PRES")
                temp_var = ds.variables.get("TEMP_ADJUSTED") or ds.variables.get("TEMP")
                psal_var = ds.variables.get("PSAL_ADJUSTED") or ds.variables.get("PSAL")
                doxy_var = ds.variables.get("DOXY_ADJUSTED") or ds.variables.get("DOXY")

                pres_qc_var = ds.variables.get("PRES_ADJUSTED_QC") or ds.variables.get("PRES_QC")
                temp_qc_var = ds.variables.get("TEMP_ADJUSTED_QC") or ds.variables.get("TEMP_QC")
                psal_qc_var = ds.variables.get("PSAL_ADJUSTED_QC") or ds.variables.get("PSAL_QC")
                doxy_qc_var = ds.variables.get("DOXY_ADJUSTED_QC") or ds.variables.get("DOXY_QC")

                if pres_var is None or temp_var is None:
                    return []

                n_prof = lat_var.shape[0] if lat_var is not None and len(lat_var.shape) > 0 else 1
                n_levels = pres_var.shape[-1] if len(pres_var.shape) > 1 else pres_var.shape[0]

                for p_idx in range(n_prof):
                    p_lat = float(lat_var[p_idx]) if lat_var is not None else None
                    p_lon = float(lon_var[p_idx]) if lon_var is not None else None
                    p_juld = float(juld_var[p_idx]) if juld_var is not None else None
                    p_cycle = int(cycle_var[p_idx]) if cycle_var is not None else None

                    for l_idx in range(n_levels):
                        pres_val = pres_var[p_idx, l_idx] if len(pres_var.shape) > 1 else pres_var[l_idx]
                        temp_val = temp_var[p_idx, l_idx] if len(temp_var.shape) > 1 else temp_var[l_idx]
                        psal_val = (psal_var[p_idx, l_idx] if len(psal_var.shape) > 1 else psal_var[l_idx]) if psal_var is not None else None
                        doxy_val = (doxy_var[p_idx, l_idx] if len(doxy_var.shape) > 1 else doxy_var[l_idx]) if doxy_var is not None else None

                        raw_dict: Dict[str, Any] = {
                            "platform_id": platform_id,
                            "cycle_number": p_cycle,
                            "latitude": p_lat,
                            "longitude": p_lon,
                            "JULD": p_juld,
                            "pressure_dbar": pres_val,
                            "temp_c": temp_val,
                            "psal_psu": psal_val,
                            "doxy_umol_kg": doxy_val,
                        }

                        if temp_qc_var is not None:
                            raw_dict["temp_qc"] = temp_qc_var[p_idx, l_idx] if len(temp_qc_var.shape) > 1 else temp_qc_var[l_idx]
                        if psal_qc_var is not None:
                            raw_dict["psal_qc"] = psal_qc_var[p_idx, l_idx] if len(psal_qc_var.shape) > 1 else psal_qc_var[l_idx]
                        if doxy_qc_var is not None:
                            raw_dict["doxy_qc"] = doxy_qc_var[p_idx, l_idx] if len(doxy_qc_var.shape) > 1 else doxy_qc_var[l_idx]

                        obs = normalize_observation_dict(raw_dict, data_source="REAL_ARGO_NETCDF")
                        if obs is not None:
                            observations.append(obs)

        except Exception as exc:
            logger.error("Error reading NetCDF file '%s': %s", file_path, exc)

        return observations
