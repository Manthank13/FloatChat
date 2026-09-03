"""
Representative sample ARGO oceanographic dataset for automated testing and offline development.

Contains realistic physical and biogeochemical observation profiles across:
1. Bay of Bengal & Chennai Offshore (Platform 2903334, 2903335)
2. Arabian Sea, Kochi & Mumbai Offshore (Platform 5906432, 5906433, 5906434)

IMPORTANT NOTE:
All records in this module are explicitly marked with `data_source="SAMPLE_TEST_DATASET"`
for testing and verification purposes.
"""

from typing import List
from data.models import ArgoObservation, ArgoProfile


def generate_sample_observations() -> List[ArgoObservation]:
    """Generate representative depth level observation records for Indian Ocean ARGO floats."""
    observations: List[ArgoObservation] = []

    # =========================================================================
    # 1. Platform 2903334 - Near Chennai / Bay of Bengal Coastal (Lat: 13.15, Lon: 80.45)
    # Distance from Chennai (13.0827, 80.2707) ≈ 20.8 km
    # =========================================================================
    
    # Profile Cycle 42 - January 2025 (2025-01-15T06:30:00Z)
    c42_levels = [
        (5.0, 5.0, 27.8, 33.15, 210.5, 0.45, 1, 1),
        (10.0, 9.9, 27.6, 33.20, 209.0, 0.42, 1, 1),
        (25.0, 24.8, 27.2, 33.45, 205.0, 0.38, 1, 1),
        (50.0, 49.6, 26.1, 34.10, 185.0, 0.25, 1, 1),
        (75.0, 74.4, 24.8, 34.60, 160.0, 0.15, 1, 1),
        (100.0, 99.2, 23.4, 34.85, 135.0, 0.08, 1, 1),   # Target 100m observation
        (150.0, 148.8, 19.8, 34.95, 95.0, 0.04, 1, 1),
        (200.0, 198.5, 16.5, 35.02, 65.0, 0.02, 1, 1),   # Target 200m observation
        (300.0, 297.8, 13.2, 35.08, 45.0, 0.01, 1, 1),
        (500.0, 496.5, 10.4, 35.05, 35.0, 0.01, 1, 1),   # Target 500m observation
        (750.0, 745.0, 7.8, 34.98, 42.0, 0.00, 1, 1),
        (1000.0, 994.0, 6.2, 34.90, 55.0, 0.00, 1, 1),
        (1500.0, 1491.0, 4.1, 34.82, 85.0, 0.00, 1, 1),
        (1950.0, 1939.0, 2.9, 34.76, 110.0, 0.00, 1, 1),
    ]

    for pres, depth, temp, psal, doxy, chla, t_qc, s_qc in c42_levels:
        observations.append(
            ArgoObservation(
                platform_id="2903334",
                cycle_number=42,
                latitude=13.1500,
                longitude=80.4500,
                timestamp="2025-01-15T06:30:00Z",
                pressure_dbar=pres,
                depth_m=depth,
                temp_c=temp,
                psal_psu=psal,
                doxy_umol_kg=doxy,
                chla_mg_m3=chla,
                temp_qc=t_qc,
                psal_qc=s_qc,
                data_source="SAMPLE_TEST_DATASET",
            )
        )

    # Profile Cycle 45 - Recent Observation (2026-08-18T10:15:00Z) - within last 30 days
    c45_levels = [
        (5.0, 5.0, 29.4, 32.80, 215.0, 0.55, 1, 1),
        (50.0, 49.6, 28.1, 33.90, 190.0, 0.30, 1, 1),
        (100.0, 99.2, 24.2, 34.78, 140.0, 0.10, 1, 1),   # Recent 100m observation
        (200.0, 198.5, 17.1, 34.98, 70.0, 0.02, 1, 1),
        (500.0, 496.5, 10.8, 35.04, 38.0, 0.01, 1, 1),
        (1000.0, 994.0, 6.4, 34.89, 58.0, 0.00, 1, 1),
    ]

    for pres, depth, temp, psal, doxy, chla, t_qc, s_qc in c45_levels:
        observations.append(
            ArgoObservation(
                platform_id="2903334",
                cycle_number=45,
                latitude=13.1420,
                longitude=80.4350,
                timestamp="2026-08-18T10:15:00Z",
                pressure_dbar=pres,
                depth_m=depth,
                temp_c=temp,
                psal_psu=psal,
                doxy_umol_kg=doxy,
                chla_mg_m3=chla,
                temp_qc=t_qc,
                psal_qc=s_qc,
                data_source="SAMPLE_TEST_DATASET",
            )
        )

    # =========================================================================
    # 2. Platform 2903335 - Central Bay of Bengal (Lat: 14.50, Lon: 87.80)
    # BGC-Argo Float with High DOXY & Chlorophyll data
    # =========================================================================
    bengal_levels = [
        (5.0, 5.0, 29.1, 32.50, 218.0, 0.65, 1, 1),
        (50.0, 49.6, 27.5, 33.60, 195.0, 0.35, 1, 1),
        (100.0, 99.2, 22.8, 34.70, 120.0, 0.12, 1, 1),
        (200.0, 198.5, 15.9, 34.95, 50.0, 0.02, 1, 1),
        (500.0, 496.5, 9.8, 35.02, 30.0, 0.01, 1, 1),
        (1000.0, 994.0, 5.9, 34.88, 52.0, 0.00, 1, 1),
    ]

    for pres, depth, temp, psal, doxy, chla, t_qc, s_qc in bengal_levels:
        observations.append(
            ArgoObservation(
                platform_id="2903335",
                cycle_number=18,
                latitude=14.5000,
                longitude=87.8000,
                timestamp="2025-02-10T14:00:00Z",
                pressure_dbar=pres,
                depth_m=depth,
                temp_c=temp,
                psal_psu=psal,
                doxy_umol_kg=doxy,
                chla_mg_m3=chla,
                temp_qc=t_qc,
                psal_qc=s_qc,
                data_source="SAMPLE_TEST_DATASET",
            )
        )

    # =========================================================================
    # 3. Platform 5906432 - Near Kochi / Arabian Sea Coast (Lat: 9.85, Lon: 75.95)
    # Distance from Kochi (9.9312, 76.2673) ≈ 35.8 km
    # Typical Arabian Sea high salinity & upwelling
    # =========================================================================
    kochi_levels = [
        (5.0, 5.0, 28.2, 35.80, 205.0, 0.50, 1, 1),
        (50.0, 49.6, 25.5, 36.20, 160.0, 0.28, 1, 1),   # 50m layer
        (100.0, 99.2, 22.0, 36.45, 110.0, 0.09, 1, 1),
        (150.0, 148.8, 18.5, 36.10, 75.0, 0.03, 1, 1),
        (200.0, 198.5, 15.2, 35.85, 48.0, 0.01, 1, 1),  # 200m layer
        (500.0, 496.5, 10.1, 35.40, 28.0, 0.00, 1, 1),
        (1000.0, 994.0, 6.8, 35.05, 45.0, 0.00, 1, 1),
    ]

    for pres, depth, temp, psal, doxy, chla, t_qc, s_qc in kochi_levels:
        observations.append(
            ArgoObservation(
                platform_id="5906432",
                cycle_number=31,
                latitude=9.8500,
                longitude=75.9500,
                timestamp="2025-01-20T08:00:00Z",
                pressure_dbar=pres,
                depth_m=depth,
                temp_c=temp,
                psal_psu=psal,
                doxy_umol_kg=doxy,
                chla_mg_m3=chla,
                temp_qc=t_qc,
                psal_qc=s_qc,
                data_source="SAMPLE_TEST_DATASET",
            )
        )

    # =========================================================================
    # 4. Platform 5906433 - Central Arabian Sea (Lat: 16.20, Lon: 64.50)
    # Arabian Sea High Salinity Water Mass (ASW) - Salinity reaches 36.75 PSU
    # =========================================================================
    arabian_central_levels = [
        (5.0, 5.0, 27.5, 36.40, 210.0, 0.35, 1, 1),
        (50.0, 49.6, 26.0, 36.75, 180.0, 0.20, 1, 1),
        (100.0, 99.2, 23.5, 36.60, 130.0, 0.06, 1, 1),
        (200.0, 198.5, 16.8, 35.95, 40.0, 0.01, 1, 1),
        (500.0, 496.5, 11.2, 35.50, 22.0, 0.00, 1, 1),
        (1000.0, 994.0, 7.1, 35.10, 38.0, 0.00, 1, 1),
    ]

    for pres, depth, temp, psal, doxy, chla, t_qc, s_qc in arabian_central_levels:
        observations.append(
            ArgoObservation(
                platform_id="5906433",
                cycle_number=55,
                latitude=16.2000,
                longitude=64.5000,
                timestamp="2024-11-12T12:00:00Z",
                pressure_dbar=pres,
                depth_m=depth,
                temp_c=temp,
                psal_psu=psal,
                doxy_umol_kg=doxy,
                chla_mg_m3=chla,
                temp_qc=t_qc,
                psal_qc=s_qc,
                data_source="SAMPLE_TEST_DATASET",
            )
        )

    # =========================================================================
    # 5. Platform 5906434 - Near Mumbai Offshore (Lat: 18.80, Lon: 72.40)
    # Multi-year historical profile series (2023, 2024, 2025)
    # =========================================================================
    mumbai_series = [
        # 2023 monsoon
        (18.80, 72.40, "2023-07-25T10:00:00Z", 10.0, 9.9, 28.5, 35.60, 1, 1),
        (18.80, 72.40, "2023-07-25T10:00:00Z", 50.0, 49.6, 26.2, 36.10, 1, 1),
        (18.80, 72.40, "2023-07-25T10:00:00Z", 100.0, 99.2, 22.4, 36.35, 1, 1),
        # 2024 summer
        (18.82, 72.42, "2024-05-18T10:00:00Z", 10.0, 9.9, 29.8, 36.20, 1, 1),
        (18.82, 72.42, "2024-05-18T10:00:00Z", 50.0, 49.6, 27.4, 36.50, 1, 1),
        (18.82, 72.42, "2024-05-18T10:00:00Z", 100.0, 99.2, 23.1, 36.40, 1, 1),
        # 2025 winter
        (18.85, 72.45, "2025-01-10T10:00:00Z", 10.0, 9.9, 26.9, 36.00, 1, 1),
        (18.85, 72.45, "2025-01-10T10:00:00Z", 50.0, 49.6, 25.1, 36.30, 1, 1),
        (18.85, 72.45, "2025-01-10T10:00:00Z", 100.0, 99.2, 22.0, 36.45, 1, 1),
    ]

    for lat, lon, ts, pres, depth, temp, psal, t_qc, s_qc in mumbai_series:
        observations.append(
            ArgoObservation(
                platform_id="5906434",
                cycle_number=12,
                latitude=lat,
                longitude=lon,
                timestamp=ts,
                pressure_dbar=pres,
                depth_m=depth,
                temp_c=temp,
                psal_psu=psal,
                temp_qc=t_qc,
                psal_qc=s_qc,
                data_source="SAMPLE_TEST_DATASET",
            )
        )

    # =========================================================================
    # 6. Quality Control Test Records (Bad flag QC=4 and Missing QC=9)
    # =========================================================================
    observations.append(
        ArgoObservation(
            platform_id="2903334",
            cycle_number=42,
            latitude=13.1500,
            longitude=80.4500,
            timestamp="2025-01-15T06:30:00Z",
            pressure_dbar=80.0,
            depth_m=79.4,
            temp_c=99.99,  # Bad sensor spike
            psal_psu=0.00,
            temp_qc=4,     # Bad QC flag
            psal_qc=4,     # Bad QC flag
            data_source="SAMPLE_TEST_DATASET",
        )
    )

    return observations


# Alias for backward and testing compatibility
get_sample_observations = generate_sample_observations
