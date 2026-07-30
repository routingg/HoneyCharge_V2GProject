"""세 모델 로드 · 피처 순서 검증 · 예측 실행."""

from __future__ import annotations

import logging
from typing import Any

import joblib
import pandas as pd

from config import (
    DEMAND_FEATURES,
    DEMAND_MODEL_PATH,
    SOLAR_FEATURES,
    SOLAR_MODEL_PATH,
    WIND_FEATURES,
    WIND_MODEL_PATH,
)

logger = logging.getLogger(__name__)


class ModelLoadError(RuntimeError):
    """모델 로드 또는 피처 검증 실패."""


def _model_feature_names(model: Any) -> list[str] | None:
    """모델의 피처 이름을 읽는다. 읽지 못하면 None (실패해도 서버는 계속 뜬다).

    LightGBM의 `feature_name_`은 네이티브 부스터를 호출하는 property라,
    일부 환경(로드된 프로세스 상태에 따라)에서 OSError(access violation)로
    프로세스를 죽인다. 따라서 hasattr 대신 예외를 모두 잡아서 처리한다.
    피처 개수 검증(n_features_in_)은 별도로 항상 수행하므로 안전하다.
    """
    for attr in ("feature_names_in_", "feature_name_"):
        try:
            names = getattr(model, attr, None)
            if names is not None and len(list(names)) > 0:
                return list(names)
        except (OSError, Exception):  # noqa: BLE001
            logger.warning("%s 속성 읽기 실패 — 피처 개수로만 검증합니다", attr)
            continue
    try:
        booster = model.get_booster()
        names = booster.feature_names
        if names:
            return list(names)
    except (OSError, Exception):  # noqa: BLE001
        pass
    return None


class ModelService:
    """서버 시작 시 한 번만 로드하고 재사용한다."""

    def __init__(self) -> None:
        self.models: dict[str, Any] = {}
        self.status: dict[str, str] = {}
        self._load_all()

    def _load_one(self, key: str, path, expected: list[str]) -> None:
        if not path.exists():
            self.status[key] = f"error: 모델 파일 없음 ({path.name})"
            return
        try:
            model = joblib.load(path)
        except ModuleNotFoundError as exc:
            self.status[key] = f"error: 필요한 패키지 없음 ({exc.name})"
            return
        except Exception as exc:  # noqa: BLE001
            self.status[key] = f"error: joblib 로드 실패 ({type(exc).__name__})"
            return

        if not hasattr(model, "predict"):
            self.status[key] = "error: predict 메서드 없음"
            return

        n_in = getattr(model, "n_features_in_", None)
        if n_in is not None and int(n_in) != len(expected):
            self.status[key] = (
                f"error: 피처 개수 불일치 (모델 {n_in} / 기대 {len(expected)})"
            )
            return

        actual = _model_feature_names(model)
        if actual is not None and actual != expected:
            only_model = sorted(set(actual) - set(expected))
            only_expected = sorted(set(expected) - set(actual))
            self.status[key] = (
                "error: 피처 이름/순서 불일치 "
                f"(모델에만={only_model}, 기대에만={only_expected})"
            )
            logger.error("%s 피처 불일치\n모델: %s\n기대: %s", key, actual, expected)
            return

        self.models[key] = model
        self.status[key] = "loaded"

    def _load_all(self) -> None:
        self._load_one("demand", DEMAND_MODEL_PATH, DEMAND_FEATURES)
        self._load_one("solar", SOLAR_MODEL_PATH, SOLAR_FEATURES)
        self._load_one("wind", WIND_MODEL_PATH, WIND_FEATURES)

    @property
    def all_loaded(self) -> bool:
        return all(v == "loaded" for v in self.status.values()) and len(self.models) == 3

    def predict(self, key: str, features: dict[str, float], order: list[str]) -> float:
        """지정 순서대로 1행 DataFrame을 만들어 예측한다."""
        model = self.models.get(key)
        if model is None:
            raise ModelLoadError(f"{key} 모델이 로드되지 않았습니다: {self.status.get(key)}")

        missing = [f for f in order if f not in features]
        if missing:
            raise ModelLoadError(f"{key} 입력 피처 누락: {missing}")

        frame = pd.DataFrame([[features[f] for f in order]], columns=order)
        try:
            value = float(model.predict(frame)[0])
        except Exception as exc:  # noqa: BLE001
            raise ModelLoadError(f"{key} 예측 실행 실패: {type(exc).__name__}: {exc}") from exc
        return value
