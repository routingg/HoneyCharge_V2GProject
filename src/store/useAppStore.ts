import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Vehicle,
  ChargingSettings,
  ChargingSession,
  PointHistoryItem,
  Coupon,
  Reservation,
  AppNotification,
  AppSettings,
  ChargingResult,
} from '@/types';
import { CURRENT_USER } from '@/data/users';
import { VEHICLES } from '@/data/vehicles';
import { POINTS_HISTORY, CURRENT_POINTS } from '@/data/pointsHistory';
import { RESERVATIONS } from '@/data/reservations';
import { NOTIFICATIONS } from '@/data/notifications';

interface AppState {
  // auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  signup: (name: string, email: string, phone: string) => void;
  logout: () => void;

  // onboarding
  onboardingCompleted: boolean;
  completeOnboarding: () => void;

  // vehicles
  vehicles: Vehicle[];
  representativeVehicleId: string;
  setRepresentativeVehicle: (id: string) => void;
  addVehicle: (v: Vehicle) => void;
  removeVehicle: (id: string) => void;
  updateVehicleSoc: (id: string, soc: number) => void;

  // charging settings & session
  chargingSettings: ChargingSettings;
  updateChargingSettings: (s: Partial<ChargingSettings>) => void;
  chargingSession: ChargingSession | null;
  startChargingSession: (session: ChargingSession) => void;
  updateChargingSession: (partial: Partial<ChargingSession>) => void;
  clearChargingSession: () => void;
  lastChargingResult: ChargingResult | null;
  setLastChargingResult: (r: ChargingResult | null) => void;

  // points & coupons
  pointsBalance: number;
  pointsHistory: PointHistoryItem[];
  addPoints: (amount: number, description: string) => void;
  spendPoints: (amount: number, description: string) => boolean;
  coupons: Coupon[];
  addCoupon: (c: Coupon) => void;

  // stations
  favoriteStationIds: string[];
  toggleFavoriteStation: (id: string) => void;

  // reservations
  reservations: Reservation[];
  addReservation: (r: Reservation) => void;
  cancelReservation: (id: string) => void;

  // notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (n: AppNotification) => void;

  // settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  // reset
  resetAllData: () => void;
}

const defaultChargingSettings: ChargingSettings = {
  targetSoc: 80,
  minSoc: 20,
  departureTime: '18:00',
  allowV2g: true,
  autoParticipate: true,
  batteryProtection: true,
  maxDischargeKw: 5,
  notifyChargeComplete: true,
  notifyV2gStart: true,
};

const defaultSettings: AppSettings = {
  pushEnabled: true,
  chargeCompleteAlert: true,
  v2gAlert: true,
  marketingAlert: false,
  darkMode: false,
  unit: 'km',
  demoMode: false,
};

const initialState = {
  user: null as User | null,
  isAuthenticated: false,
  onboardingCompleted: false,
  vehicles: VEHICLES,
  representativeVehicleId: VEHICLES.find((v) => v.isRepresentative)?.id ?? VEHICLES[0].id,
  chargingSettings: defaultChargingSettings,
  chargingSession: null as ChargingSession | null,
  lastChargingResult: null as ChargingResult | null,
  pointsBalance: CURRENT_POINTS,
  pointsHistory: POINTS_HISTORY,
  coupons: [] as Coupon[],
  favoriteStationIds: [] as string[],
  reservations: RESERVATIONS,
  notifications: NOTIFICATIONS,
  settings: defaultSettings,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (email) =>
        set({
          user: { ...CURRENT_USER, email },
          isAuthenticated: true,
        }),
      signup: (name, email, phone) =>
        set({
          user: { ...CURRENT_USER, name, email, phone },
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, isAuthenticated: false }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      setRepresentativeVehicle: (id) =>
        set((state) => ({
          representativeVehicleId: id,
          vehicles: state.vehicles.map((v) => ({ ...v, isRepresentative: v.id === id })),
        })),
      addVehicle: (v) => set((state) => ({ vehicles: [...state.vehicles, v] })),
      removeVehicle: (id) =>
        set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) })),
      updateVehicleSoc: (id, soc) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, currentSoc: soc } : v)),
        })),

      updateChargingSettings: (s) =>
        set((state) => ({ chargingSettings: { ...state.chargingSettings, ...s } })),

      startChargingSession: (session) => set({ chargingSession: session }),
      updateChargingSession: (partial) =>
        set((state) => ({
          chargingSession: state.chargingSession ? { ...state.chargingSession, ...partial } : null,
        })),
      clearChargingSession: () => set({ chargingSession: null }),
      setLastChargingResult: (r) => set({ lastChargingResult: r }),

      addPoints: (amount, description) =>
        set((state) => ({
          pointsBalance: state.pointsBalance + amount,
          pointsHistory: [
            {
              id: `pt-${Date.now()}`,
              date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              type: '적립',
              amount,
              description,
              balanceAfter: state.pointsBalance + amount,
            },
            ...state.pointsHistory,
          ],
        })),
      spendPoints: (amount, description) => {
        const state = get();
        if (state.pointsBalance < amount) return false;
        set({
          pointsBalance: state.pointsBalance - amount,
          pointsHistory: [
            {
              id: `pt-${Date.now()}`,
              date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              type: '사용',
              amount: -amount,
              description,
              balanceAfter: state.pointsBalance - amount,
            },
            ...state.pointsHistory,
          ],
        });
        return true;
      },
      addCoupon: (c) => set((state) => ({ coupons: [c, ...state.coupons] })),

      toggleFavoriteStation: (id) =>
        set((state) => ({
          favoriteStationIds: state.favoriteStationIds.includes(id)
            ? state.favoriteStationIds.filter((s) => s !== id)
            : [...state.favoriteStationIds, id],
        })),

      addReservation: (r) => set((state) => ({ reservations: [r, ...state.reservations] })),
      cancelReservation: (id) =>
        set((state) => ({
          reservations: state.reservations.map((r) => (r.id === id ? { ...r, status: '취소' } : r)),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
      removeNotification: (id) =>
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
      addNotification: (n) => set((state) => ({ notifications: [n, ...state.notifications] })),

      updateSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),

      resetAllData: () => set({ ...initialState }),
    }),
    {
      name: 'honeycharge-storage',
    }
  )
);
