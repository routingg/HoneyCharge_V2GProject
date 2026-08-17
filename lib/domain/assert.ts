/** Physical-bound validators (§14, §26). Reject invalid values at the boundary. */

export function assertValidSoc(soc: number, label = "soc"): number {
  if (!Number.isFinite(soc) || soc < 0 || soc > 100) {
    throw new RangeError(`${label} must be within [0, 100], got ${soc}`);
  }
  return soc;
}

export function clampSoc(soc: number): number {
  return Math.min(100, Math.max(0, soc));
}

export function assertNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be >= 0, got ${value}`);
  }
  return value;
}

export function assertValidTimestamp(iso: string, label = "timestamp"): string {
  if (Number.isNaN(Date.parse(iso))) {
    throw new RangeError(`${label} is not a valid ISO datetime: ${iso}`);
  }
  return iso;
}

export function socToKWh(soc: number, capacityKWh: number): number {
  return (soc / 100) * capacityKWh;
}

export function kWhToSocDelta(kWh: number, capacityKWh: number): number {
  return (kWh / capacityKWh) * 100;
}
