"""predict 크래시 원인 격리: 메인 스레드 vs 워커 스레드."""

import sys
import threading
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd  # noqa: E402

from config import DEMAND_FEATURES, SOLAR_FEATURES, WIND_FEATURES  # noqa: E402
from data_service import DataService  # noqa: E402
from model_service import ModelService  # noqa: E402

ms = ModelService()
ds = DataService()
print("모델 상태:", ms.status)
print("데이터 상태:", ds.status)

feats, ts = ds.build_features(None)
print("피처 준비 완료:", len(feats), "개 /", ts)


def run(label: str) -> None:
    for key, order in (("demand", DEMAND_FEATURES), ("solar", SOLAR_FEATURES), ("wind", WIND_FEATURES)):
        try:
            value = ms.predict(key, feats, order)
            print(f"  [{label}] {key}: {value:.2f}")
        except Exception:
            print(f"  [{label}] {key}: 실패")
            traceback.print_exc()


print("\n--- 메인 스레드 ---")
run("main")

print("\n--- 워커 스레드 ---")
t = threading.Thread(target=run, args=("worker",))
t.start()
t.join()
print("\n완료")
