import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/hooks/useToast';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { RequireAuth } from '@/routes/RequireAuth';
import { RootGate } from '@/routes/RootGate';
import { PATHS } from '@/routes/paths';

import Splash from '@/pages/Splash';
import OnboardingEnergy from '@/pages/onboarding/OnboardingEnergy';
import OnboardingReward from '@/pages/onboarding/OnboardingReward';
import OnboardingVehicle from '@/pages/onboarding/OnboardingVehicle';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import AiScheduleDetail from '@/pages/home/AiScheduleDetail';
import ParticipateSettings from '@/pages/charging/ParticipateSettings';
import ParticipateConfirm from '@/pages/charging/ParticipateConfirm';
import ChargingSession from '@/pages/charging/ChargingSession';
import ChargingResult from '@/pages/charging/ChargingResult';
import MapView from '@/pages/stations/MapView';
import StationsList from '@/pages/stations/StationsList';
import StationDetail from '@/pages/stations/StationDetail';
import StationReserve from '@/pages/stations/StationReserve';
import ReservationSuccess from '@/pages/stations/ReservationSuccess';
import RewardsHome from '@/pages/rewards/RewardsHome';
import RewardDetail from '@/pages/rewards/RewardDetail';
import RewardExchangeConfirm from '@/pages/rewards/RewardExchangeConfirm';
import RewardExchangeSuccess from '@/pages/rewards/RewardExchangeSuccess';
import RewardHistory from '@/pages/rewards/RewardHistory';
import VehicleMain from '@/pages/vehicle/VehicleMain';
import VehicleRegister from '@/pages/vehicle/VehicleRegister';
import VehicleDetail from '@/pages/vehicle/VehicleDetail';
import BatteryHealth from '@/pages/vehicle/BatteryHealth';
import NotificationsList from '@/pages/notifications/NotificationsList';
import NotificationDetail from '@/pages/notifications/NotificationDetail';
import Profile from '@/pages/profile/Profile';
import Settings from '@/pages/profile/Settings';
import Impact from '@/pages/reports/Impact';
import MonthlyReport from '@/pages/reports/MonthlyReport';
import Support from '@/pages/support/Support';
import Faq from '@/pages/support/Faq';
import NotFound from '@/pages/NotFound';

function Protected({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path={PATHS.splash} element={<Splash />} />
            <Route path={PATHS.onboardingEnergy} element={<OnboardingEnergy />} />
            <Route path={PATHS.onboardingReward} element={<OnboardingReward />} />
            <Route path={PATHS.onboardingVehicle} element={<OnboardingVehicle />} />
            <Route path={PATHS.login} element={<Login />} />
            <Route path={PATHS.signup} element={<Signup />} />

            <Route path={PATHS.home} element={<RootGate />} />
            <Route path={PATHS.aiSchedule} element={<Protected><AiScheduleDetail /></Protected>} />
            <Route path={PATHS.participate} element={<Protected><ParticipateSettings /></Protected>} />
            <Route path={PATHS.participateConfirm} element={<Protected><ParticipateConfirm /></Protected>} />
            <Route path={PATHS.chargingSession} element={<Protected><ChargingSession /></Protected>} />
            <Route path={PATHS.chargingResult} element={<Protected><ChargingResult /></Protected>} />

            <Route path={PATHS.map} element={<Protected><MapView /></Protected>} />
            <Route path={PATHS.stations} element={<Protected><StationsList /></Protected>} />
            <Route path="/stations/:stationId" element={<Protected><StationDetail /></Protected>} />
            <Route path="/stations/:stationId/reserve" element={<Protected><StationReserve /></Protected>} />
            <Route path={PATHS.reservationSuccess} element={<Protected><ReservationSuccess /></Protected>} />

            <Route path={PATHS.rewards} element={<Protected><RewardsHome /></Protected>} />
            <Route path="/rewards/history" element={<Protected><RewardHistory /></Protected>} />
            <Route path="/rewards/exchange-success" element={<Protected><RewardExchangeSuccess /></Protected>} />
            <Route path="/rewards/:rewardId/exchange" element={<Protected><RewardExchangeConfirm /></Protected>} />
            <Route path="/rewards/:rewardId" element={<Protected><RewardDetail /></Protected>} />

            <Route path={PATHS.vehicle} element={<Protected><VehicleMain /></Protected>} />
            <Route path={PATHS.vehicleRegister} element={<Protected><VehicleRegister /></Protected>} />
            <Route path={PATHS.vehicleDetail} element={<Protected><VehicleDetail /></Protected>} />
            <Route path={PATHS.vehicleBatteryHealth} element={<Protected><BatteryHealth /></Protected>} />

            <Route path={PATHS.notifications} element={<Protected><NotificationsList /></Protected>} />
            <Route path="/notifications/:notificationId" element={<Protected><NotificationDetail /></Protected>} />

            <Route path={PATHS.profile} element={<Protected><Profile /></Protected>} />
            <Route path={PATHS.impact} element={<Protected><Impact /></Protected>} />
            <Route path={PATHS.reportMonthly} element={<Protected><MonthlyReport /></Protected>} />
            <Route path={PATHS.settings} element={<Protected><Settings /></Protected>} />
            <Route path={PATHS.support} element={<Protected><Support /></Protected>} />
            <Route path={PATHS.supportFaq} element={<Protected><Faq /></Protected>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
