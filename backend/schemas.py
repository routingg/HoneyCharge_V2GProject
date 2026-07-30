"""요청 · 응답 스키마."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    target_time: str | None = Field(
        default=None,
        description="예측 기준 시각(ISO). 생략 시 공공데이터의 첫 시점을 사용",
    )
    current_soc: float = Field(default=45, ge=0, le=100)
    target_soc: float = Field(default=80, ge=0, le=100)
    minimum_soc: float = Field(default=30, ge=0, le=100)
    v2g_supported: bool = True
    simulate_hour: int | None = Field(
        default=None,
        ge=0,
        le=23,
        description="지정 시 실측 데이터 대신 해당 시(0~23)의 근사 곡선으로 시뮬레이션",
    )


class Predictions(BaseModel):
    demand: float
    solar_generation: float
    wind_generation: float


class RenewableGeneration(BaseModel):
    total: float
    energy_gap: float
    gap_ratio: float


class Recommendation(BaseModel):
    status: Literal["CHARGE", "V2G_AVAILABLE", "HOLD", "INSUFFICIENT_DATA"]
    title: str
    description: str


class DataInfo(BaseModel):
    source: str
    observation_type: str
    reference_time: str
    note: str
    unit: str
    units_comparable: bool
    is_simulated: bool = False


class PredictResponse(BaseModel):
    timestamp: str
    predictions: Predictions
    renewable_generation: RenewableGeneration
    recommendation: Recommendation
    data_info: DataInfo


class ErrorResponse(BaseModel):
    status: Literal["INSUFFICIENT_DATA", "MODEL_ERROR", "BAD_REQUEST"]
    message: str
    missing_features: list[str] = []
