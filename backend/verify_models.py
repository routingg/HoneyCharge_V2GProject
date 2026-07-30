"""모델 3개를 실제 로드해 클래스·피처 개수·피처 이름을 확인한다."""

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "models"

DEMAND_FEATURES = [
    "temperature_c", "apparent_temperature_c", "relative_humidity_pct",
    "rainfall_mm", "cloud_cover_pct", "demand_lag_1h", "demand_lag_24h",
    "demand_lag_168h", "hour_sin", "hour_cos", "dow_sin", "dow_cos",
    "doy_sin", "doy_cos", "is_weekend",
]
SOLAR_FEATURES = [
    "temperature_c", "solar_irradiance_wm2", "cloud_cover_pct", "rainfall_mm",
    "solar_capacity_mw", "solar_lag_1h", "solar_lag_24h", "solar_lag_168h",
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "doy_sin", "doy_cos",
    "is_weekend",
]
WIND_FEATURES = [
    "wind_speed_ms", "wind_speed_100m_ms", "wind_gusts_10m_ms",
    "wind_direction_100m_sin", "wind_direction_100m_cos", "pressure_msl_hpa",
    "wind_capacity_mw", "wind_lag_1h", "wind_lag_24h", "wind_lag_168h",
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "doy_sin", "doy_cos",
    "is_weekend",
]

try:
    import joblib
except ImportError:
    print("FAIL joblib 미설치"); sys.exit(1)

for name, expected in (
    ("demand_model.joblib", DEMAND_FEATURES),
    ("solar_model.joblib", SOLAR_FEATURES),
    ("wind_model.joblib", WIND_FEATURES),
):
    path = BASE / name
    print(f"\n=== {name} ===")
    if not path.exists():
        print("  FAIL 파일 없음"); continue
    try:
        model = joblib.load(path)
    except Exception as exc:  # noqa: BLE001
        print(f"  FAIL 로드 실패: {type(exc).__name__}: {exc}"); continue

    print(f"  클래스: {type(model).__module__}.{type(model).__name__}")
    print(f"  predict 존재: {hasattr(model, 'predict')}")

    actual = None
    for attr in ("feature_name_", "feature_names_in_"):
        if hasattr(model, attr):
            actual = list(getattr(model, attr)); print(f"  {attr}: {len(actual)}개"); break
    if actual is None and hasattr(model, "get_booster"):
        try:
            actual = list(model.get_booster().feature_names or [])
            print(f"  booster.feature_names: {len(actual)}개")
        except Exception:
            pass
    if actual is None and hasattr(model, "booster_"):
        try:
            actual = list(model.booster_.feature_name())
            print(f"  booster_.feature_name(): {len(actual)}개")
        except Exception:
            pass

    n_expected = len(expected)
    n_in = getattr(model, "n_features_in_", None)
    print(f"  n_features_in_: {n_in} / 기대: {n_expected}")

    if actual:
        if actual == expected:
            print("  ✅ 피처 이름·순서 일치")
        else:
            print("  ❌ 불일치")
            print(f"     모델: {actual}")
            print(f"     기대: {expected}")
            print(f"     모델에만: {sorted(set(actual) - set(expected))}")
            print(f"     기대에만: {sorted(set(expected) - set(actual))}")
    else:
        print("  ⚠️ 피처 이름을 읽을 수 없음 (개수만 확인)")
