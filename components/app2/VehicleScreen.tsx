"use client";

import { useState, type FormEvent } from "react";
import { useApp2Session } from "@/components/app2/auth/AuthProvider";
import {
  HyundaiVehicleProvider,
  MockVehicleProvider,
  type HyundaiVehicleCandidate,
} from "@/lib/services/vehicle/vehicleRegistry";

/** §6: manual registration (email/Kakao/Google/Apple) vs my현대 auto-search (Hyundai). */
export function VehicleScreen() {
  const { user, vehicle } = useApp2Session();
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [candidates, setCandidates] = useState<HyundaiVehicleCandidate[] | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const isHyundaiUser = user?.authProvider === "hyundai";

  async function loadHyundaiCandidates() {
    setLoadingCandidates(true);
    const list = await HyundaiVehicleProvider.fetchCandidateVehicles();
    setCandidates(list);
    setLoadingCandidates(false);
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manufacturer.trim() || !model.trim() || !batteryCapacity.trim()) return;
    MockVehicleProvider.registerManualVehicle({
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      plateNumber: plateNumber.trim(),
      batteryCapacityKWh: Number(batteryCapacity),
    });
  }

  if (vehicle) {
    return (
      <div className="a2-vehicle-screen">
        <h1 className="a2-screen-title">내 차량</h1>
        <div className="a2-vehicle-card">
          <span className={`a2-vehicle-source-badge is-${vehicle.source}`}>
            {vehicle.source === "hyundai" ? "my현대 연동" : "수동 등록"}
          </span>
          <strong>{vehicle.model}</strong>
          <p>
            {vehicle.manufacturer}
            {vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ""}
          </p>
          <p>배터리 용량 {vehicle.batteryCapacityKWh}kWh</p>
        </div>
      </div>
    );
  }

  return (
    <div className="a2-vehicle-screen">
      <h1 className="a2-screen-title">내 차량 등록</h1>

      {isHyundaiUser ? (
        <div className="a2-vehicle-hyundai">
          <p className="a2-vehicle-hyundai-copy">
            my현대 연동으로 로그인하셨어요. 연결할 차량을 검색해보세요.
          </p>
          {!candidates && (
            <button
              type="button"
              className="a2-vehicle-cta"
              onClick={() => void loadHyundaiCandidates()}
              disabled={loadingCandidates}
            >
              {loadingCandidates ? "차량 검색 중..." : "차량 자동 검색"}
            </button>
          )}
          {candidates && (
            <ul className="a2-vehicle-candidate-list">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <div>
                    <strong>
                      {candidate.model} {candidate.trim}
                    </strong>
                    <span>
                      {candidate.plateNumber} · {candidate.batteryCapacityKWh}kWh
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => HyundaiVehicleProvider.connectVehicle(candidate)}
                  >
                    연결
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form className="a2-vehicle-form" onSubmit={handleManualSubmit}>
          <label htmlFor="a2-vehicle-plate">차량 번호</label>
          <input
            id="a2-vehicle-plate"
            value={plateNumber}
            onChange={(event) => setPlateNumber(event.target.value)}
            placeholder="12가 3456"
          />

          <label htmlFor="a2-vehicle-manufacturer">제조사</label>
          <input
            id="a2-vehicle-manufacturer"
            value={manufacturer}
            onChange={(event) => setManufacturer(event.target.value)}
            placeholder="현대자동차"
          />

          <label htmlFor="a2-vehicle-model">모델</label>
          <input
            id="a2-vehicle-model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="아이오닉 5"
          />

          <label htmlFor="a2-vehicle-battery">배터리 용량 (kWh)</label>
          <input
            id="a2-vehicle-battery"
            type="number"
            inputMode="decimal"
            value={batteryCapacity}
            onChange={(event) => setBatteryCapacity(event.target.value)}
            placeholder="77.4"
          />

          <button type="submit" className="a2-vehicle-cta">
            차량 등록
          </button>
        </form>
      )}
    </div>
  );
}
