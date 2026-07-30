"""AI 에너지 예측 데모 설정값.

추천 기준값은 전부 여기에서만 관리한다(코드 곳곳에 숫자를 흩뿌리지 않는다).
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
MODEL_DIR = PROJECT_ROOT / "models"

DEMAND_MODEL_PATH = MODEL_DIR / "demand_model.joblib"
SOLAR_MODEL_PATH = MODEL_DIR / "solar_model.joblib"
WIND_MODEL_PATH = MODEL_DIR / "wind_model.joblib"

# live_input_Builder 가 생성한 공공데이터 기반 입력 행
INPUT_CSV_PATH = MODEL_DIR / "historical_realtime_2024-05-16_1300.csv"

TIMEZONE = "Asia/Seoul"

# ── 모델 피처 (학습 시 순서 그대로) ──────────────────────────────────────────
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

# ── 단위 ────────────────────────────────────────────────────────────────────
# live_input_Builder.txt 의 전처리 코드에서 확인:
#   demand_mw / solar_mw / wind_available_mw, capacity 도 _mw
#   → 세 모델의 타깃 단위가 MW로 동일하므로 합산·비교가 가능하다.
UNIT = "MW"
UNITS_COMPARABLE = True

# ── 추천 기준값 ─────────────────────────────────────────────────────────────
# 재생에너지 총합과 수요의 차이를 수요 대비 비율로 판단한다.
SURPLUS_RATIO_THRESHOLD = 0.05   # 재생 - 수요 ≥ +5% → 충전 권장
DEFICIT_RATIO_THRESHOLD = -0.05  # 재생 - 수요 ≤ -5% → V2G 검토

# ── 데이터 출처 표기 ────────────────────────────────────────────────────────
DATA_SOURCE_LABEL = "공공데이터 (KPX 전력수요·발전실적, 기상 관측)"
OBSERVATION_TYPE = "historical"  # 과거 관측 데이터 — 실시간 아님
DATA_NOTE = (
    "KPX 제주 풍력 출력제어가 발생한 2024-05-16 13:00 시점을 "
    "공공데이터로 재구성한 과거 관측 기반 입력입니다."
)
