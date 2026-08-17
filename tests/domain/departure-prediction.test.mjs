import assert from "node:assert/strict";
import test from "node:test";
import { predictDeparture } from "../../lib/domain/mobility/departurePrediction.ts";
import { toKstIso } from "../../lib/domain/clock.ts";

function tripAt(dateIso, dayOfWeek) {
  return {
    tripId: `t-${dateIso}`,
    departureTime: dateIso,
    arrivalTime: dateIso,
    startSoc: 80,
    endSoc: 70,
    distanceKm: 15,
    energyUsedKWh: 3,
    dayOfWeek,
  };
}

const MONDAY_DATES = [
  "2026-06-01",
  "2026-06-08",
  "2026-06-15",
  "2026-06-22",
  "2026-06-29",
  "2026-07-06",
  "2026-07-13",
  "2026-07-20",
];

function mondaysAt8am(count) {
  return MONDAY_DATES.slice(0, count).map((date) => tripAt(`${date}T08:00:00+09:00`, 1));
}

test("predicts a consistent weekday departure from history, close to the observed time", () => {
  // Every past Monday departed close to 08:00.
  const trips = [
    tripAt("2026-08-03T08:00:00+09:00", 1),
    tripAt("2026-08-10T08:05:00+09:00", 1),
    tripAt("2026-08-17T07:58:00+09:00", 1),
  ];
  const now = new Date("2026-08-24T06:00:00+09:00"); // also a Monday
  const prediction = predictDeparture({
    now,
    trips,
    calendarEvents: [],
    calendarEnabled: false,
  });

  const predictedMinute =
    Number(prediction.predictedDeparture.slice(11, 13)) * 60 +
    Number(prediction.predictedDeparture.slice(14, 16));
  assert.ok(Math.abs(predictedMinute - 8 * 60) <= 15, `predicted ${prediction.predictedDeparture}`);
  assert.ok(prediction.confidence > 0, `confidence was ${prediction.confidence}`);
  assert.ok(prediction.sourceWeights.historical > 0);
});

test("more historical samples produce higher confidence than a handful of samples", () => {
  const now = new Date("2026-08-24T06:00:00+09:00");
  const few = predictDeparture({
    now,
    trips: mondaysAt8am(3),
    calendarEvents: [],
    calendarEnabled: false,
  });
  const many = predictDeparture({
    now,
    trips: mondaysAt8am(8),
    calendarEvents: [],
    calendarEnabled: false,
  });
  assert.ok(many.confidence >= few.confidence, `few=${few.confidence} many=${many.confidence}`);
});

test("falls back to a conservative default with low confidence when there is no history", () => {
  const now = new Date("2026-08-24T06:00:00+09:00");
  const prediction = predictDeparture({
    now,
    trips: [],
    calendarEvents: [],
    calendarEnabled: false,
  });
  assert.ok(prediction.confidence <= 0.3);
  assert.equal(prediction.sourceWeights.historical, 0);
});

test("a mobility-relevant calendar event with a location shifts the prediction earlier", () => {
  const trips = [
    tripAt("2026-08-17T08:00:00+09:00", 1),
    tripAt("2026-08-10T08:00:00+09:00", 1),
  ];
  const now = new Date("2026-08-24T05:00:00+09:00");
  const withoutCalendar = predictDeparture({
    now,
    trips,
    calendarEvents: [],
    calendarEnabled: false,
  });
  const withCalendar = predictDeparture({
    now,
    trips,
    calendarEvents: [
      {
        id: "ev-1",
        start: toKstIso(new Date("2026-08-24T06:30:00+09:00")),
        end: toKstIso(new Date("2026-08-24T07:30:00+09:00")),
        allDay: false,
        location: "광주캠퍼스",
      },
    ],
    calendarEnabled: true,
  });

  assert.ok(
    new Date(withCalendar.predictedDeparture).getTime() <
      new Date(withoutCalendar.predictedDeparture).getTime(),
  );
  assert.ok(withCalendar.sourceWeights.calendar > 0);
});
