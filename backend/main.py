"""AI 에너지 예측 데모 API (해커톤 MVP).

로컬 실행: cd backend && uvicorn main:app --reload --port 8001
배포(Render 등): uvicorn main:app --host 0.0.0.0 --port $PORT (render.yaml 참고)
"""

from __future__ import annotations

import logging
import os

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import (
    DATA_NOTE,
    DATA_SOURCE_LABEL,
    DEFICIT_RATIO_THRESHOLD,
    DEMAND_FEATURES,
    OBSERVATION_TYPE,
    SOLAR_FEATURES,
    SURPLUS_RATIO_THRESHOLD,
    TIMEZONE,
    UNIT,
    UNITS_COMPARABLE,
    WIND_FEATURES,
)
from data_service import DataService, DataUnavailable
from model_service import ModelLoadError, ModelService
from schemas import PredictRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HoneyCharge AI Energy Prediction", version="0.1.0")

# 로컬 dev 포트 + 배포 도메인 기본 허용. 추가 배포 도메인은 ALLOWED_ORIGINS(콤마 구분)로 덮어쓴다.
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "https://peaceful-kitsune-896019.netlify.app",
]
_extra_origins = os.environ.get("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = DEFAULT_ORIGINS + [o.strip() for o in _extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# 서버 시작 시 한 번만 로드
model_service = ModelService()
data_service = DataService()


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok" if model_service.all_loaded and data_service.status == "loaded" else "degraded",
        "models": model_service.status,
        "data": {
            "status": data_service.status,
            "source": "public_data",
            "error": data_service.error,
            "available_times": data_service.available_times(),
        },
        "unit": UNIT,
        "units_comparable": UNITS_COMPARABLE,
    }


def _recommend(demand: float, solar: float, wind: float, req: PredictRequest) -> dict:
    """규칙 기반 추천. 기준값은 config에서만 관리한다."""
    if not UNITS_COMPARABLE:
        return {
            "status": "INSUFFICIENT_DATA",
            "title": "데이터 확인 필요",
            "description": "모델별 출력 단위가 확인되지 않아 충전 및 V2G 추천을 계산할 수 없습니다.",
        }

    renewable = solar + wind
    gap = renewable - demand
    ratio = gap / demand if demand else 0.0

    # 안전 조건 우선
    can_v2g = req.v2g_supported and req.current_soc > req.minimum_soc

    if ratio >= SURPLUS_RATIO_THRESHOLD:
        if req.current_soc < req.target_soc:
            return {
                "status": "CHARGE",
                "title": "전기차 충전을 권장합니다",
                "description": (
                    f"예상 재생에너지 발전량({renewable:,.1f}{UNIT})이 "
                    f"전력수요({demand:,.1f}{UNIT})보다 {gap:,.1f}{UNIT} 많은 시간대입니다. "
                    "잉여 전력을 흡수하면 출력제어를 줄일 수 있습니다."
                ),
            }
        return {
            "status": "HOLD",
            "title": "대기를 권장합니다",
            "description": (
                f"재생에너지가 {gap:,.1f}{UNIT} 여유 있지만 이미 목표 충전량"
                f"({req.target_soc:.0f}%)에 도달해 추가 충전이 필요하지 않습니다."
            ),
        }

    if ratio <= DEFICIT_RATIO_THRESHOLD and can_v2g:
        return {
            "status": "V2G_AVAILABLE",
            "title": "V2G 참여가 가능합니다",
            "description": (
                f"전력수요({demand:,.1f}{UNIT})가 재생에너지 발전량"
                f"({renewable:,.1f}{UNIT})보다 {abs(gap):,.1f}{UNIT} 높습니다. "
                f"현재 배터리 {req.current_soc:.0f}%는 최소 보장 {req.minimum_soc:.0f}% 위이므로 "
                "전력을 나눌 여유가 있습니다."
            ),
        }

    if ratio <= DEFICIT_RATIO_THRESHOLD:
        reason = (
            "차량이 V2G를 지원하지 않습니다."
            if not req.v2g_supported
            else f"현재 배터리 {req.current_soc:.0f}%가 최소 보장 {req.minimum_soc:.0f}% 이하입니다."
        )
        return {
            "status": "HOLD",
            "title": "대기를 권장합니다",
            "description": f"전력수요가 높은 시간대이지만 {reason} V2G 참여를 권하지 않습니다.",
        }

    return {
        "status": "HOLD",
        "title": "대기를 권장합니다",
        "description": (
            f"재생에너지 발전량과 전력수요 차이가 {abs(gap):,.1f}{UNIT}"
            f"({abs(ratio) * 100:.1f}%)로 작아 충전·방전 모두 급하지 않습니다."
        ),
    }


@app.post("/api/predict/energy")
def predict_energy(req: PredictRequest) -> JSONResponse:
    if not model_service.all_loaded:
        return JSONResponse(
            status_code=503,
            content={
                "status": "MODEL_ERROR",
                "message": "모델이 로드되지 않았습니다.",
                "detail": model_service.status,
            },
        )

    target = None
    if req.target_time:
        try:
            target = pd.Timestamp(req.target_time)
        except Exception:  # noqa: BLE001
            return JSONResponse(
                status_code=400,
                content={"status": "BAD_REQUEST", "message": "target_time 형식이 올바르지 않습니다."},
            )

    try:
        if req.simulate_hour is not None:
            features, ts = data_service.build_simulated_features(req.simulate_hour)
        else:
            features, ts = data_service.build_features(target)
    except DataUnavailable as exc:
        return JSONResponse(
            status_code=422,
            content={
                "status": "INSUFFICIENT_DATA",
                "message": str(exc),
                "missing_features": exc.missing,
            },
        )

    try:
        demand = model_service.predict("demand", features, DEMAND_FEATURES)
        solar = model_service.predict("solar", features, SOLAR_FEATURES)
        wind = model_service.predict("wind", features, WIND_FEATURES)
    except ModelLoadError as exc:
        return JSONResponse(
            status_code=500,
            content={"status": "MODEL_ERROR", "message": str(exc)},
        )

    renewable = solar + wind
    gap = renewable - demand

    return JSONResponse(
        content={
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S"),
            "predictions": {
                "demand": round(demand, 1),
                "solar_generation": round(solar, 1),
                "wind_generation": round(wind, 1),
            },
            "renewable_generation": {
                "total": round(renewable, 1),
                "energy_gap": round(gap, 1),
                "gap_ratio": round(gap / demand, 4) if demand else 0.0,
            },
            "recommendation": _recommend(demand, solar, wind, req),
            "data_info": {
                "source": DATA_SOURCE_LABEL,
                "observation_type": "simulated" if req.simulate_hour is not None else OBSERVATION_TYPE,
                "reference_time": ts.strftime("%Y-%m-%dT%H:%M:%S"),
                "note": (
                    "실측 2024-05-16 13:00 데이터를 기준으로 태양광은 일사 곡선, "
                    "수요는 전형적 부하 곡선으로 근사 스케일링한 데모용 시뮬레이션입니다."
                    if req.simulate_hour is not None
                    else DATA_NOTE
                ),
                "unit": UNIT,
                "units_comparable": UNITS_COMPARABLE,
                "timezone": TIMEZONE,
                "is_simulated": req.simulate_hour is not None,
            },
        }
    )
