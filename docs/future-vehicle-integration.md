# Future Real-Vehicle Integration

**Nothing in this implementation talks to a real vehicle, a real charger,
or a real manufacturer API (§104 — non-negotiable).** This document is
the contract a future integration needs to satisfy.

## The interface it must implement

`lib/domain/vehicle/types.ts::VehicleAdapter`:

```ts
interface VehicleAdapter {
  getState(): Promise<VehicleState>;
  requestCharge(powerKW: number): Promise<void>;
  requestDischarge(powerKW: number): Promise<void>;
  stopEnergyTransfer(): Promise<void>;
}
```

`SimulationVehicleAdapter` (today) and a future
`FutureConnectedVehicleAdapter` are interchangeable at this boundary — no
domain code (`predictDeparture`, `calculateGuaranteedSoc`,
`buildAdaptiveSchedule`) needs to change.

## Stub already in the codebase

`lib/domain/vehicle/futureConnectedVehicleAdapter.ts` — every method
throws `NOT IMPLEMENTED — requires an authorized vehicle API`. This is
intentional (§31, §98): it documents the shape without pretending a real
integration exists.

## Minimum required inputs from a real vehicle backend (§98)

- SOC (current battery percentage)
- Plug/connection state
- Charge state (idle/charging/discharging)
- Max charge power (kW)
- Max discharge power (kW)
- Vehicle availability (parked & controllable vs. driving/unavailable)
- Telemetry timestamp (so `STALE_TELEMETRY_MINUTES` staleness detection —
  `lib/domain/config.ts` — can actually work)
- An authorized command endpoint (charge/discharge/stop)
- Command acknowledgement (so a failed command doesn't silently get
  treated as "in progress" by the safety state machine)

No proprietary API (Hyundai or otherwise) is assumed or named anywhere in
this codebase.

## SIL -> HILS -> pilot progression (§99)

```
Today:    SIL   — SimulationVehicleAdapter, this repo
Next:      HILS  — real charger/BMS hardware, adapter still implements VehicleAdapter,
                    but getState()/requestCharge() etc. talk to real hardware over
                    whatever protocol the hardware exposes (OCPP, CAN, vendor API)
Later:    Pilot — real vehicle(s), same interface, additional legal/safety review
```

Each step only requires a new class implementing `VehicleAdapter` — the
prediction, SOC, and scheduling logic (already tested against the
simulation) does not change.

## Non-negotiable before any real hardware/vehicle pilot

- Security review of the command path (authentication, authorization,
  replay protection).
- Battery manufacturer policy review (warranty implications of V2G
  cycling).
- Power market / grid-interconnection regulatory review for the target
  jurisdiction.
- Real measured efficiency/consumption data to replace
  `DEFAULT_CHARGE_EFFICIENCY`/`DEFAULT_DISCHARGE_EFFICIENCY`
  (`lib/domain/config.ts`), which are reasonable estimates, not
  calibrated to any specific vehicle.
