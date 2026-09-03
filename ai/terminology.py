"""
Oceanographic terminology, parameter synonyms, geographic locations, and unit definitions.

This module maps natural language expressions used by scientists and laypersons to
standard ARGO physical variables and geographic coordinates.
"""

from typing import Any, Dict, List, Optional, Tuple
from ai.models import OceanParameter

# Parameter synonym dictionary mapping user terms to standard ARGO parameters
PARAMETER_SYNONYMS: Dict[str, OceanParameter] = {
    # Practical Salinity (PSAL)
    "salinity": OceanParameter.PSAL,
    "practical salinity": OceanParameter.PSAL,
    "psal": OceanParameter.PSAL,
    "salt": OceanParameter.PSAL,
    "sal": OceanParameter.PSAL,
    "psu": OceanParameter.PSAL,
    "saltiness": OceanParameter.PSAL,
    "ocean salinity": OceanParameter.PSAL,
    "sea salinity": OceanParameter.PSAL,
    "salinity profile": OceanParameter.PSAL,

    # Temperature (TEMP)
    "temperature": OceanParameter.TEMP,
    "temp": OceanParameter.TEMP,
    "sea temperature": OceanParameter.TEMP,
    "sea water temperature": OceanParameter.TEMP,
    "seawater temperature": OceanParameter.TEMP,
    "sea surface temperature": OceanParameter.TEMP,
    "water temperature": OceanParameter.TEMP,
    "ocean temperature": OceanParameter.TEMP,
    "sst": OceanParameter.TEMP,
    "thermal": OceanParameter.TEMP,
    "heat": OceanParameter.TEMP,
    "warmth": OceanParameter.TEMP,
    "temperature profile": OceanParameter.TEMP,

    # Pressure (PRES) / Depth
    "pressure": OceanParameter.PRES,
    "pres": OceanParameter.PRES,
    "dbar": OceanParameter.PRES,
    "decibar": OceanParameter.PRES,
    "decibars": OceanParameter.PRES,
    "hydrostatic pressure": OceanParameter.PRES,

    # Biogeochemical Parameters: Dissolved Oxygen (DOXY)
    "oxygen": OceanParameter.DOXY,
    "dissolved oxygen": OceanParameter.DOXY,
    "oxygen concentration": OceanParameter.DOXY,
    "doxy": OceanParameter.DOXY,
    "o2": OceanParameter.DOXY,
    "hypoxia": OceanParameter.DOXY,
    "anoxia": OceanParameter.DOXY,

    # Chlorophyll-a (CHLA)
    "chlorophyll": OceanParameter.CHLA,
    "chlorophyll-a": OceanParameter.CHLA,
    "chlorophyll a": OceanParameter.CHLA,
    "chla": OceanParameter.CHLA,
    "algae": OceanParameter.CHLA,
    "phytoplankton": OceanParameter.CHLA,
    "fluorescence": OceanParameter.CHLA,

    # Nitrate (NITRATE)
    "nitrate": OceanParameter.NITRATE,
    "no3": OceanParameter.NITRATE,
    "nutrients": OceanParameter.NITRATE,

    # pH (PH_IN_SITU_TOTAL)
    "ph": OceanParameter.PH_IN_SITU_TOTAL,
    "acidity": OceanParameter.PH_IN_SITU_TOTAL,
    "ocean acidification": OceanParameter.PH_IN_SITU_TOTAL,

    # Backscattering / Turbidity (BBP700)
    "turbidity": OceanParameter.BBP700,
    "backscatter": OceanParameter.BBP700,
    "backscattering": OceanParameter.BBP700,
    "bbp700": OceanParameter.BBP700,
    "particle backscattering": OceanParameter.BBP700,
}

# Parameter metadata including units and realistic physical ranges
PARAMETER_METADATA: Dict[OceanParameter, Dict[str, Any]] = {
    OceanParameter.PSAL: {
        "full_name": "Practical Salinity",
        "unit": "PSU",
        "valid_min": 0.0,
        "valid_max": 45.0,
        "standard_argo_code": "PSAL",
        "description": "Practical Salinity calculated using PSS-78 from conductivity, temperature, and pressure.",
    },
    OceanParameter.TEMP: {
        "full_name": "In-situ Sea Water Temperature",
        "unit": "°C",
        "valid_min": -2.5,
        "valid_max": 40.0,
        "standard_argo_code": "TEMP",
        "description": "In-situ sea water temperature on ITS-90 scale.",
    },
    OceanParameter.PRES: {
        "full_name": "Sea Water Pressure",
        "unit": "dbar",
        "valid_min": 0.0,
        "valid_max": 6000.0,
        "standard_argo_code": "PRES",
        "description": "Sea water pressure in decibars (1 dbar ≈ 1 meter depth).",
    },
    OceanParameter.DOXY: {
        "full_name": "Dissolved Oxygen",
        "unit": "µmol/kg",
        "valid_min": 0.0,
        "valid_max": 500.0,
        "standard_argo_code": "DOXY",
        "description": "Dissolved oxygen concentration from optode sensor.",
    },
    OceanParameter.CHLA: {
        "full_name": "Chlorophyll-A Concentration",
        "unit": "mg/m³",
        "valid_min": 0.0,
        "valid_max": 50.0,
        "standard_argo_code": "CHLA",
        "description": "Chlorophyll-a fluorescence estimated concentration.",
    },
    OceanParameter.NITRATE: {
        "full_name": "Nitrate",
        "unit": "µmol/kg",
        "valid_min": 0.0,
        "valid_max": 60.0,
        "standard_argo_code": "NITRATE",
        "description": "Nitrate concentration from UV spectrophotometer (SUNA / Deep-SUNA).",
    },
    OceanParameter.PH_IN_SITU_TOTAL: {
        "full_name": "In-situ pH Total Scale",
        "unit": "pH units",
        "valid_min": 6.5,
        "valid_max": 8.5,
        "standard_argo_code": "PH_IN_SITU_TOTAL",
        "description": "In-situ pH on the total scale from ISFET sensor.",
    },
    OceanParameter.BBP700: {
        "full_name": "Particle Backscattering at 700nm",
        "unit": "m⁻¹",
        "valid_min": 0.0,
        "valid_max": 0.1,
        "standard_argo_code": "BBP700",
        "description": "Optical particle backscattering coefficient.",
    },
}

# Known geographic locations, marine bodies, and coastal landmarks
# Coordinates: (latitude, longitude)
# Bounding box: (min_lat, min_lon, max_lat, max_lon)
KNOWN_OCEAN_LOCATIONS: Dict[str, Dict[str, Any]] = {
    # Coastal Indian Cities & Ports
    "chennai": {
        "name": "Chennai",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "default_radius_km": 200.0,
        "region": "Bay of Bengal",
    },
    "mumbai": {
        "name": "Mumbai",
        "latitude": 18.9220,
        "longitude": 72.8347,
        "default_radius_km": 50.0,
        "region": "Arabian Sea",
    },
    "kochi": {
        "name": "Kochi",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "default_radius_km": 50.0,
        "region": "Arabian Sea",
    },
    "cochin": {
        "name": "Kochi",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "default_radius_km": 50.0,
        "region": "Arabian Sea",
    },
    "goa": {
        "name": "Goa",
        "latitude": 15.2993,
        "longitude": 73.8243,
        "default_radius_km": 50.0,
        "region": "Arabian Sea",
    },
    "visakhapatnam": {
        "name": "Visakhapatnam",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "default_radius_km": 50.0,
        "region": "Bay of Bengal",
    },
    "vizag": {
        "name": "Visakhapatnam",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "default_radius_km": 50.0,
        "region": "Bay of Bengal",
    },
    "kolkata": {
        "name": "Kolkata",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "default_radius_km": 100.0,
        "region": "Bay of Bengal",
    },
    "kanyakumari": {
        "name": "Kanyakumari",
        "latitude": 8.0883,
        "longitude": 77.5385,
        "default_radius_km": 50.0,
        "region": "Indian Ocean",
    },
    "lakshadweep": {
        "name": "Lakshadweep",
        "latitude": 10.5667,
        "longitude": 72.6417,
        "default_radius_km": 100.0,
        "region": "Arabian Sea",
    },
    "andaman": {
        "name": "Andaman Islands",
        "latitude": 11.7401,
        "longitude": 92.6586,
        "default_radius_km": 150.0,
        "region": "Andaman Sea",
    },
    "nicobar": {
        "name": "Nicobar Islands",
        "latitude": 7.1360,
        "longitude": 93.7996,
        "default_radius_km": 150.0,
        "region": "Bay of Bengal",
    },

    # Regional Seas & Ocean Basins
    "arabian sea": {
        "name": "Arabian Sea",
        "latitude": 16.0,
        "longitude": 64.0,
        "bounding_box": (8.0, 50.0, 25.0, 77.0),
        "default_radius_km": 500.0,
    },
    "bay of bengal": {
        "name": "Bay of Bengal",
        "latitude": 14.0,
        "longitude": 88.0,
        "bounding_box": (5.0, 80.0, 22.0, 95.0),
        "default_radius_km": 500.0,
    },
    "indian ocean": {
        "name": "Indian Ocean",
        "latitude": 5.0,
        "longitude": 75.0,
        "bounding_box": (-40.0, 30.0, 25.0, 115.0),
        "default_radius_km": 2500.0,
    },
    "equatorial indian ocean": {
        "name": "Equatorial Indian Ocean",
        "latitude": 0.0,
        "longitude": 75.0,
        "bounding_box": (-5.0, 60.0, 5.0, 90.0),
        "default_radius_km": 500.0,
    },
    "southern ocean": {
        "name": "Southern Ocean",
        "latitude": -60.0,
        "longitude": 0.0,
        "bounding_box": (-75.0, -180.0, -50.0, 180.0),
        "default_radius_km": 1000.0,
    },
    "persian gulf": {
        "name": "Persian Gulf",
        "latitude": 26.0,
        "longitude": 52.0,
        "bounding_box": (24.0, 48.0, 30.0, 56.0),
        "default_radius_km": 200.0,
    },
    "red sea": {
        "name": "Red Sea",
        "latitude": 22.0,
        "longitude": 38.0,
        "bounding_box": (12.0, 32.0, 28.0, 44.0),
        "default_radius_km": 300.0,
    },
    "andaman sea": {
        "name": "Andaman Sea",
        "latitude": 10.0,
        "longitude": 96.0,
        "bounding_box": (5.0, 92.0, 16.0, 99.0),
        "default_radius_km": 300.0,
    },

    # International Ocean Landmarks & Global Coastal Regions
    "sri lanka": {
        "name": "Sri Lanka",
        "latitude": 7.8731,
        "longitude": 80.7718,
        "default_radius_km": 100.0,
    },
    "colombo": {
        "name": "Colombo",
        "latitude": 6.9271,
        "longitude": 79.8612,
        "default_radius_km": 80.0,
    },
    "maldives": {
        "name": "Maldives",
        "latitude": 3.2028,
        "longitude": 73.2207,
        "default_radius_km": 100.0,
    },
    "pacific ocean": {
        "name": "Pacific Ocean",
        "latitude": 0.0,
        "longitude": -160.0,
        "bounding_box": (-60.0, 120.0, 60.0, -70.0),
        "default_radius_km": 2000.0,
    },
    "north pacific": {
        "name": "North Pacific Ocean",
        "latitude": 30.0,
        "longitude": -160.0,
        "bounding_box": (0.0, 120.0, 65.0, -100.0),
        "default_radius_km": 1500.0,
    },
    "south pacific": {
        "name": "South Pacific Ocean",
        "latitude": -30.0,
        "longitude": -140.0,
        "bounding_box": (-60.0, 140.0, 0.0, -70.0),
        "default_radius_km": 1500.0,
    },
    "atlantic ocean": {
        "name": "Atlantic Ocean",
        "latitude": 0.0,
        "longitude": -30.0,
        "bounding_box": (-60.0, -80.0, 65.0, 20.0),
        "default_radius_km": 2000.0,
    },
    "north atlantic": {
        "name": "North Atlantic Ocean",
        "latitude": 35.0,
        "longitude": -40.0,
        "bounding_box": (0.0, -80.0, 65.0, 10.0),
        "default_radius_km": 1500.0,
    },
    "south atlantic": {
        "name": "South Atlantic Ocean",
        "latitude": -30.0,
        "longitude": -20.0,
        "bounding_box": (-60.0, -70.0, 0.0, 20.0),
        "default_radius_km": 1500.0,
    },
    "arctic ocean": {
        "name": "Arctic Ocean",
        "latitude": 80.0,
        "longitude": 0.0,
        "bounding_box": (65.0, -180.0, 90.0, 180.0),
        "default_radius_km": 1000.0,
    },

    # North America & Caribbean
    "miami": {
        "name": "Miami / Florida Coast",
        "latitude": 25.7617,
        "longitude": -80.1918,
        "bounding_box": (23.0, -84.0, 28.0, -78.0),
        "default_radius_km": 300.0,
        "region": "North Atlantic",
    },
    "florida": {
        "name": "Florida Coast",
        "latitude": 27.6648,
        "longitude": -81.5158,
        "bounding_box": (24.0, -88.0, 31.0, -79.0),
        "default_radius_km": 200.0,
        "region": "Gulf of Mexico / Atlantic",
    },
    "california": {
        "name": "California Coast",
        "latitude": 36.7783,
        "longitude": -119.4179,
        "bounding_box": (32.0, -125.0, 42.0, -117.0),
        "default_radius_km": 300.0,
        "region": "North Pacific",
    },
    "los angeles": {
        "name": "Los Angeles / Southern California",
        "latitude": 33.9425,
        "longitude": -118.4081,
        "default_radius_km": 150.0,
        "region": "North Pacific",
    },
    "san francisco": {
        "name": "San Francisco Bay / Coastal California",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "default_radius_km": 150.0,
        "region": "North Pacific",
    },
    "san diego": {
        "name": "San Diego",
        "latitude": 32.7157,
        "longitude": -117.1611,
        "default_radius_km": 150.0,
        "region": "North Pacific",
    },
    "new york": {
        "name": "New York / Mid-Atlantic Bight",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "default_radius_km": 150.0,
        "region": "North Atlantic",
    },
    "gulf of mexico": {
        "name": "Gulf of Mexico",
        "latitude": 25.0,
        "longitude": -90.0,
        "bounding_box": (18.0, -98.0, 31.0, -81.0),
        "default_radius_km": 600.0,
    },
    "caribbean": {
        "name": "Caribbean Sea",
        "latitude": 15.0,
        "longitude": -75.0,
        "bounding_box": (9.0, -88.0, 22.0, -60.0),
        "default_radius_km": 600.0,
    },
    "caribbean sea": {
        "name": "Caribbean Sea",
        "latitude": 15.0,
        "longitude": -75.0,
        "bounding_box": (9.0, -88.0, 22.0, -60.0),
        "default_radius_km": 600.0,
    },
    "hawaii": {
        "name": "Hawaii / Central Pacific",
        "latitude": 21.3069,
        "longitude": -157.8583,
        "default_radius_km": 300.0,
        "region": "North Pacific",
    },
    "honolulu": {
        "name": "Honolulu",
        "latitude": 21.3069,
        "longitude": -157.8583,
        "default_radius_km": 200.0,
        "region": "North Pacific",
    },
    "seattle": {
        "name": "Seattle / Puget Sound / Pacific Northwest",
        "latitude": 47.6062,
        "longitude": -122.3321,
        "default_radius_km": 200.0,
        "region": "North Pacific",
    },
    "alaska": {
        "name": "Gulf of Alaska / Bering Sea",
        "latitude": 58.0,
        "longitude": -150.0,
        "bounding_box": (50.0, -170.0, 65.0, -130.0),
        "default_radius_km": 600.0,
    },

    # Asia & Western Pacific
    "tokyo": {
        "name": "Tokyo / Kuroshio Current",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "default_radius_km": 200.0,
        "region": "North Pacific",
    },
    "japan": {
        "name": "Japan Offshore / Western Pacific",
        "latitude": 36.2048,
        "longitude": 138.2529,
        "bounding_box": (28.0, 128.0, 45.0, 148.0),
        "default_radius_km": 500.0,
    },
    "sydney": {
        "name": "Sydney / East Australian Current",
        "latitude": -33.8688,
        "longitude": 151.2093,
        "bounding_box": (-38.0, 148.0, -30.0, 156.0),
        "default_radius_km": 300.0,
        "region": "South Pacific / Tasman Sea",
    },
    "australia": {
        "name": "Australian Waters",
        "latitude": -25.2744,
        "longitude": 133.7751,
        "bounding_box": (-45.0, 110.0, -10.0, 160.0),
        "default_radius_km": 1500.0,
    },
    "melbourne": {
        "name": "Melbourne / Bass Strait",
        "latitude": -37.8136,
        "longitude": 144.9631,
        "default_radius_km": 200.0,
        "region": "Southern Ocean",
    },
    "perth": {
        "name": "Perth / Leeuwin Current",
        "latitude": -31.9505,
        "longitude": 115.8605,
        "default_radius_km": 200.0,
        "region": "Indian Ocean",
    },
    "coral sea": {
        "name": "Coral Sea",
        "latitude": -18.0,
        "longitude": 152.0,
        "bounding_box": (-25.0, 142.0, -10.0, 160.0),
        "default_radius_km": 600.0,
    },
    "tasman sea": {
        "name": "Tasman Sea",
        "latitude": -38.0,
        "longitude": 160.0,
        "bounding_box": (-46.0, 148.0, -30.0, 175.0),
        "default_radius_km": 600.0,
    },
    "south china sea": {
        "name": "South China Sea",
        "latitude": 12.0,
        "longitude": 113.0,
        "bounding_box": (3.0, 105.0, 22.0, 120.0),
        "default_radius_km": 600.0,
    },
    "philippine sea": {
        "name": "Philippine Sea",
        "latitude": 18.0,
        "longitude": 130.0,
        "bounding_box": (5.0, 122.0, 30.0, 145.0),
        "default_radius_km": 800.0,
    },

    # Europe & Mediterranean
    "mediterranean": {
        "name": "Mediterranean Sea",
        "latitude": 35.0,
        "longitude": 18.0,
        "bounding_box": (30.0, -6.0, 45.0, 36.0),
        "default_radius_km": 800.0,
    },
    "mediterranean sea": {
        "name": "Mediterranean Sea",
        "latitude": 35.0,
        "longitude": 18.0,
        "bounding_box": (30.0, -6.0, 45.0, 36.0),
        "default_radius_km": 800.0,
    },
    "north sea": {
        "name": "North Sea",
        "latitude": 56.0,
        "longitude": 3.0,
        "bounding_box": (51.0, -4.0, 62.0, 10.0),
        "default_radius_km": 400.0,
    },
    "baltic sea": {
        "name": "Baltic Sea",
        "latitude": 58.0,
        "longitude": 20.0,
        "bounding_box": (53.0, 10.0, 66.0, 30.0),
        "default_radius_km": 400.0,
    },
    "norwegian sea": {
        "name": "Norwegian Sea",
        "latitude": 67.0,
        "longitude": 5.0,
        "bounding_box": (60.0, -10.0, 75.0, 20.0),
        "default_radius_km": 600.0,
    },
    "bay of biscay": {
        "name": "Bay of Biscay",
        "latitude": 45.5,
        "longitude": -4.0,
        "bounding_box": (43.0, -9.0, 48.5, -1.0),
        "default_radius_km": 300.0,
    },
    "iceland": {
        "name": "Iceland Waters / Subpolar North Atlantic",
        "latitude": 64.1466,
        "longitude": -21.9426,
        "default_radius_km": 300.0,
    },
}

# Depth layers and vertical ocean structure
DEPTH_LAYERS: Dict[str, Tuple[float, float]] = {
    "surface": (0.0, 10.0),
    "near surface": (0.0, 20.0),
    "mixed layer": (0.0, 50.0),
    "upper ocean": (0.0, 200.0),
    "epipelagic": (0.0, 200.0),
    "thermocline": (100.0, 500.0),
    "mesopelagic": (200.0, 1000.0),
    "deep sea": (1000.0, 2000.0),
    "deep ocean": (1000.0, 2000.0),
    "bathypelagic": (1000.0, 4000.0),
    "abyssal": (2000.0, 6000.0),
    "abyss": (2000.0, 6000.0),
}

# Seasonal synonyms
SEASON_MAPPINGS: Dict[str, str] = {
    "summer": "summer",
    "winter": "winter",
    "monsoon": "southwest_monsoon",
    "southwest monsoon": "southwest_monsoon",
    "sw monsoon": "southwest_monsoon",
    "northeast monsoon": "northeast_monsoon",
    "ne monsoon": "northeast_monsoon",
    "spring": "spring",
    "autumn": "autumn",
    "fall": "autumn",
}
