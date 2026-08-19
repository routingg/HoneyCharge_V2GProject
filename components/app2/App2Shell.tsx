"use client";

import { useState } from "react";
import { BottomNavApp2, type App2View } from "@/components/app2/BottomNavApp2";
import { DashboardHome } from "@/components/app2/DashboardHome";
import { RewardsScreen } from "@/components/app2/RewardsScreen";
import { StationListScreen } from "@/components/app2/StationListScreen";
import { StationMapScreen } from "@/components/app2/StationMapScreen";
import { VehicleScreen } from "@/components/app2/VehicleScreen";

/** Post-auth, post-onboarding shell — the /app2 equivalent of MobileShell. */
export function App2Shell() {
  const [view, setView] = useState<App2View>("home");
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);

  function openStationOnMap(stationId: string) {
    setFocusedStationId(stationId);
    setView("map");
  }

  return (
    <div className="a2-shell">
      <div className="a2-shell-scroll">
        {view === "home" && (
          <DashboardHome
            onOpenStations={() => setView("stations")}
            onOpenRewards={() => setView("rewards")}
          />
        )}
        {view === "stations" && <StationListScreen onOpenMap={openStationOnMap} />}
        {view === "map" && (
          <StationMapScreen
            initialStationId={focusedStationId}
            onBack={() => setView("stations")}
          />
        )}
        {view === "rewards" && <RewardsScreen />}
        {view === "vehicle" && <VehicleScreen />}
      </div>

      <BottomNavApp2 view={view === "map" ? "stations" : view} onNavigate={setView} />
    </div>
  );
}
