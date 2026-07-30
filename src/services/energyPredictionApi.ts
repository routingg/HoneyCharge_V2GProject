/**
 * AI 에너지 예측 API 클라이언트.
 * 백엔드 주소는 VITE_ENERGY_API_BASE_URL 로 분리한다(기본 http://127.0.0.1:8001).
 */

const BASE_URL =
  (import.meta.env.VITE_ENERGY_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8001';

export interface PredictRequest {
  target_time?: string;
  current_soc: number;
  target_soc: number;
  minimum_soc: number;
  v2g_supported: boolean;
  simulate_hour?: number;
}

export type RecommendationStatus = 'CHARGE' | 'V2G_AVAILABLE' | 'HOLD' | 'INSUFFICIENT_DATA';

export interface PredictResponse {
  timestamp: string;
  predictions: {
    demand: number;
    solar_generation: number;
    wind_generation: number;
  };
  renewable_generation: {
    total: number;
    energy_gap: number;
    gap_ratio: number;
  };
  recommendation: {
    status: RecommendationStatus;
    title: string;
    description: string;
  };
  data_info: {
    source: string;
    observation_type: string;
    reference_time: string;
    note: string;
    unit: string;
    units_comparable: boolean;
    timezone: string;
    is_simulated: boolean;
  };
}

export interface HealthResponse {
  status: string;
  models: Record<string, string>;
  data: {
    status: string;
    source: string;
    error: string | null;
    available_times: string[];
  };
  unit: string;
  units_comparable: boolean;
}

export type EnergyApiErrorKind =
  | 'network'
  | 'insufficient_data'
  | 'model_error'
  | 'bad_request'
  | 'unknown';

export class EnergyApiError extends Error {
  // `erasableSyntaxOnly` 때문에 파라미터 프로퍼티를 쓸 수 없어 명시적으로 대입한다.
  kind: EnergyApiErrorKind;
  missingFeatures: string[];

  constructor(message: string, kind: EnergyApiErrorKind, missingFeatures: string[] = []) {
    super(message);
    this.kind = kind;
    this.missingFeatures = missingFeatures;
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new EnergyApiError('상태 확인에 실패했어요.', 'unknown');
    return (await res.json()) as HealthResponse;
  } catch (e) {
    if (e instanceof EnergyApiError) throw e;
    throw new EnergyApiError(
      `예측 서버에 연결할 수 없어요. (${BASE_URL})`,
      'network'
    );
  }
}

export async function predictEnergy(body: PredictRequest): Promise<PredictResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/predict/energy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new EnergyApiError(`예측 서버에 연결할 수 없어요. (${BASE_URL})`, 'network');
  }

  if (res.ok) return (await res.json()) as PredictResponse;

  const detail = await res.json().catch(() => null);
  const status = detail?.status as string | undefined;
  if (status === 'INSUFFICIENT_DATA') {
    throw new EnergyApiError(
      detail?.message ?? '해당 시각의 공공데이터가 부족해요.',
      'insufficient_data',
      detail?.missing_features ?? []
    );
  }
  if (status === 'MODEL_ERROR') {
    throw new EnergyApiError(detail?.message ?? '모델 실행에 실패했어요.', 'model_error');
  }
  if (status === 'BAD_REQUEST') {
    throw new EnergyApiError(detail?.message ?? '입력값을 확인해 주세요.', 'bad_request');
  }
  throw new EnergyApiError(`예측에 실패했어요. (HTTP ${res.status})`, 'unknown');
}
