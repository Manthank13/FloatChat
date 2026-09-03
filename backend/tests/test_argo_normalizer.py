from app.services.normalizer import ArgoNormalizer


def test_clean_float_val_nan_missing_ocean_fill() -> None:
    assert ArgoNormalizer.clean_float_val("NaN") is None
    assert ArgoNormalizer.clean_float_val("nan") is None
    assert ArgoNormalizer.clean_float_val(None) is None
    assert ArgoNormalizer.clean_float_val(99999.0) is None
    assert ArgoNormalizer.clean_float_val(-9999.0) is None
    assert ArgoNormalizer.clean_float_val("25.143") == 25.143
    assert ArgoNormalizer.clean_float_val(10.5) == 10.5


def test_depth_derivation() -> None:
    assert ArgoNormalizer.derive_depth(100.0) == 99.3
    assert ArgoNormalizer.derive_depth(0.0) == 0.0
    assert ArgoNormalizer.derive_depth(None) is None
    assert ArgoNormalizer.derive_depth(-10.0) is None


def test_temperature_salinity_validation() -> None:
    # Valid
    assert ArgoNormalizer.validate_temperature(18.5) == 18.5
    assert ArgoNormalizer.validate_salinity(36.2) == 36.2

    # Out of physical bounds
    assert ArgoNormalizer.validate_temperature(55.0) is None
    assert ArgoNormalizer.validate_temperature(-10.0) is None
    assert ArgoNormalizer.validate_salinity(-5.0) is None
    assert ArgoNormalizer.validate_salinity(60.0) is None


def test_normalize_erddap_table_grouping_and_deduplication() -> None:
    table_data = {
        "columnNames": [
            "platform_number",
            "cycle_number",
            "time",
            "latitude",
            "longitude",
            "pres",
            "temp",
            "psal",
            "pres_qc",
            "temp_qc",
            "psal_qc",
        ],
        "rows": [
            ["6902746", 135, "2020-07-07T07:39:00Z", 24.974, -84.123, 10.0, 29.914, 36.41, "1", "1", "1"],
            ["6902746", 135, "2020-07-07T07:39:00Z", 24.974, -84.123, 10.0, 29.914, 36.41, "1", "1", "1"],  # Duplicate
            ["6902746", 135, "2020-07-07T07:39:00Z", 24.974, -84.123, 50.0, 25.100, 36.50, "1", "1", "1"],
            ["6902746", 136, "2020-07-17T07:39:00Z", 25.100, -84.200, "NaN", 20.0, 36.0, "1", "1", "1"],
        ],
    }

    profiles = ArgoNormalizer.normalize_erddap_table(table_data, is_mock=False, data_source="erddap_ifremer")
    assert len(profiles) == 2

    p1 = [p for p in profiles if p.cycle_number == 135][0]
    assert len(p1.observations) == 2  # Deduplicated from 3 to 2
    assert p1.observations[0].pressure == 10.0
    assert p1.observations[0].depth == 9.93
    assert p1.observations[1].pressure == 50.0

    p2 = [p for p in profiles if p.cycle_number == 136][0]
    assert p2.observations[0].pressure is None
    assert p2.observations[0].temperature == 20.0
