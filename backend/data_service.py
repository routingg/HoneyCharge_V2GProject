"""공공데이터 입력 행 로드 · 시간 피처 생성 · 모델 입력 조립.

입력 CSV는 live_input_Builder 가 공공데이터(KPX 수요/발전실적, 기상관측)에서
lag 값까지 계산해 만든 결과물이다. 여기서는 그 값을 읽어 쓰기만 하고
임의의 값으로 채우지 않는다.
"""

from __future__ import annotations

import math

import pandas as pd

from config import (
    DEMAND_FEATURES,
    INPUT_CSV_PATH,
    SOLAR_FEATURES,
    WIND_FEATURES,
)

ALL_FEATURES = set(DEMAND_FEATURES) | set(SOLAR_FEATURES) | set(WIND_FEATURES)

# 타임스탬프에서 파생하는 피처 (CSV에 없어도 됨)
DERIVED = {
    "hour_sin", "hour_cos", "dow_sin", "dow_cos",
    "doy_sin", "doy_cos", "is_weekend",
}


class DataUnavailable(RuntimeError):
    """요청 시각의 공공데이터가 없거나 필수 피처가 비어 있음."""

    def __init__(self, message: str, missing: list[str] | None = None) -> None:
        super().__init__(message)
        self.missing = missing or []


def _time_features(ts: pd.Timestamp) -> dict[str, float]:
    """live_input_Builder 와 동일한 방식(라디안 변환)으로 생성."""
    hour = ts.hour + ts.minute / 60
    dow = ts.dayofweek
    doy = ts.dayofyear
    return {
        "hour_sin": math.sin(2 * math.pi * hour / 24),
        "hour_cos": math.cos(2 * math.pi * hour / 24),
        "dow_sin": math.sin(2 * math.pi * dow / 7),
        "dow_cos": math.cos(2 * math.pi * dow / 7),
        "doy_sin": math.sin(2 * math.pi * doy / 365.25),
        "doy_cos": math.cos(2 * math.pi * doy / 365.25),
        "is_weekend": 1.0 if dow >= 5 else 0.0,
    }


class DataService:
    def __init__(self) -> None:
        self.frame: pd.DataFrame | None = None
        self.status = "not_loaded"
        self.error: str | None = None
        self._load()

    def _load(self) -> None:
        if not INPUT_CSV_PATH.exists():
            self.status = "error"
            self.error = f"공공데이터 파일 없음: {INPUT_CSV_PATH.name}"
            return
        try:
            frame = pd.read_csv(INPUT_CSV_PATH, encoding="utf-8-sig")
            frame["timestamp"] = pd.to_datetime(frame["timestamp"])
            self.frame = frame.sort_values("timestamp").reset_index(drop=True)
            self.status = "loaded"
        except Exception as exc:  # noqa: BLE001
            self.status = "error"
            self.error = f"CSV 로드 실패: {type(exc).__name__}: {exc}"

    def available_times(self) -> list[str]:
        if self.frame is None:
            return []
        return [ts.strftime("%Y-%m-%dT%H:%M:%S") for ts in self.frame["timestamp"]]

    def build_features(self, target_time: pd.Timestamp | None) -> tuple[dict[str, float], pd.Timestamp]:
        """해당 시각의 공공데이터 행에서 모델 입력 피처를 만든다.

        target_time 이 None 이면 데이터의 유일한(또는 첫) 행을 사용한다.
        """
        if self.frame is None or self.frame.empty:
            raise DataUnavailable(self.error or "공공데이터가 로드되지 않았습니다.")

        if target_time is None:
            row = self.frame.iloc[0]
        else:
            target = pd.Timestamp(target_time).tz_localize(None).floor("h")
            match = self.frame[self.frame["timestamp"] == target]
            if match.empty:
                raise DataUnavailable(
                    f"{target:%Y-%m-%d %H:%M} 시각의 공공데이터가 없습니다. "
                    f"사용 가능: {', '.join(self.available_times())}"
                )
            row = match.iloc[0]

        ts = pd.Timestamp(row["timestamp"])
        features: dict[str, float] = dict(_time_features(ts))

        missing: list[str] = []
        for name in ALL_FEATURES - DERIVED:
            if name not in row.index:
                missing.append(name)
                continue
            value = row[name]
            # 결측값을 조용히 0으로 채우지 않는다.
            if pd.isna(value):
                missing.append(name)
                continue
            features[name] = float(value)

        if missing:
            raise DataUnavailable(
                "필수 입력 피처가 공공데이터에 없습니다.", sorted(missing)
            )

        return features, ts

    def build_simulated_features(self, hour: int) -> tuple[dict[str, float], pd.Timestamp]:
        """실측 앵커 행을 기준으로 시간대(0~23) 근사 곡선을 적용한 데모용 시뮬레이션.

        실제 시계열 관측치가 아니라 태양광은 일사 곡선, 수요는 전형적 부하 곡선으로
        앵커 값을 스케일링한 근사치다. 풍속 등 나머지 피처는 앵커 값을 유지한다.
        """
        if self.frame is None or self.frame.empty:
            raise DataUnavailable(self.error or "공공데이터가 로드되지 않았습니다.")

        anchor = self.frame.iloc[0]
        anchor_ts = pd.Timestamp(anchor["timestamp"])
        ts = anchor_ts.replace(hour=hour, minute=0, second=0)
        features: dict[str, float] = dict(_time_features(ts))

        def daylight(h: int) -> float:
            return max(0.0, math.sin(math.pi * (h - 6) / 13)) if 6 <= h <= 19 else 0.0

        def demand_curve(h: int) -> float:
            return 0.75 + 0.25 * math.cos(2 * math.pi * (h - 15) / 24)

        d_anchor = daylight(anchor_ts.hour)
        solar_scale = daylight(hour) / d_anchor if d_anchor > 0 else daylight(hour)
        demand_scale = demand_curve(hour) / demand_curve(anchor_ts.hour)

        SOLAR_SCALED = {"solar_irradiance_wm2", "solar_lag_1h", "solar_lag_24h", "solar_lag_168h"}
        DEMAND_SCALED = {"demand_lag_1h", "demand_lag_24h", "demand_lag_168h"}

        for name in ALL_FEATURES - DERIVED:
            if name not in anchor.index or pd.isna(anchor[name]):
                continue
            value = float(anchor[name])
            if name in SOLAR_SCALED:
                value *= solar_scale
            elif name in DEMAND_SCALED:
                value *= demand_scale
            features[name] = value

        return features, ts
