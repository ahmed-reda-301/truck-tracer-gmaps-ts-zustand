// Zustand store for truck tracking application
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import {
  TruckStore,
  Truck,
  Route,
  Position,
  Alert,
  TruckFilters,
  AlertFilters,
  MapViewport,
} from "../types";

// Import JSON data - Saudi Arabia Edition
import saudiTrucksData from "../data/saudi_trucks.json";
import routesData from "../data/routes.json";
import checkpointsData from "../data/checkpoints.json";
import airportsData from "../data/airports.json";
import securityPointsData from "../data/security-points.json";

// Initial state
const initialState = {
  trucks: saudiTrucksData as Truck[], // Load Saudi trucks immediately
  routes: routesData as Route[], // Load routes immediately
  checkpoints: checkpointsData as any[], // Load checkpoints immediately
  airports: airportsData as any[], // Load airports immediately
  securityPoints: securityPointsData as any[], // Load security points immediately
  filters: {
    origin: undefined,
    destination: undefined,
    route: undefined,
    status: undefined,
    company: undefined,
    truckType: undefined,
    hasAlerts: undefined,
    alertTypes: undefined,
  } as TruckFilters,
  alertFilters: {
    types: [],
    severities: [],
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      end: new Date().toISOString(),
    },
    truckIds: undefined,
  } as AlertFilters,
  ui: {
    selectedTruckId: null,
    showRoutes: true,
    showCheckpoints: true,
    showAirports: false,
    showSecurityPoints: true,
    sidebarOpen: true,
    filterPanelOpen: false,
    alertPanelOpen: false,
    mapViewport: {
      center: { lat: 24.7136, lng: 46.6753 }, // Riyadh center
      zoom: 6,
    },
    theme: "light",
  },

  // Animation state
  animations: [],

  isLoading: false,
  error: null,
  lastUpdate: null,
};

/**
 * Main Zustand store for truck tracking application
 *
 * This store demonstrates key Zustand concepts:
 * 1. Store creation with TypeScript
 * 2. State management with actions
 * 3. Devtools integration
 * 4. Complex state updates
 * 5. Async actions
 */
export const useTruckStore = create<TruckStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Data loading actions
      loadTrucks: async () => {
        const currentState = get();

        // Prevent multiple simultaneous loading attempts
        if (currentState.isLoading) {
          console.log("🚛 Store: Already loading trucks, skipping...");
          return;
        }

        // Don't reload if trucks are already loaded
        if (currentState.trucks.length > 0) {
          console.log("🚛 Store: Trucks already loaded, skipping...");
          return;
        }

        console.log("🚛 Store: Starting loadTrucks...");
        set({ isLoading: true, error: null });
        try {
          // Simulate API call delay - reduced for better UX
          await new Promise((resolve) => setTimeout(resolve, 300));

          // In a real app, this would be an API call
          const trucks = saudiTrucksData as Truck[];
          console.log("🚛 Store: Loaded", trucks.length, "trucks");

          set({
            trucks,
            isLoading: false, // Set loading to false after trucks are loaded
            lastUpdate: new Date().toISOString(),
          });
          console.log("🚛 Store: Trucks set in state, isLoading set to false");
        } catch (error) {
          console.error("🚛 Store: Error loading trucks:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to load trucks",
            isLoading: false,
          });
        }
      },

      loadRoutes: async () => {
        const currentState = get();

        // Don't reload if routes are already loaded
        if (currentState.routes.length > 0) {
          console.log("🛣️ Store: Routes already loaded, skipping...");
          return;
        }

        console.log("🛣️ Store: Starting loadRoutes...");
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          const routes = routesData as Route[];
          console.log("🛣️ Store: Loaded", routes.length, "routes");
          set({ routes });
          console.log("🛣️ Store: Routes set in state");
        } catch (error) {
          console.error("🛣️ Store: Error loading routes:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to load routes",
            isLoading: false,
          });
        }
      },

      loadCheckpoints: async () => {
        try {
          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 100));
          // Load checkpoints data
          set({ checkpoints: checkpointsData as any[] });
        } catch (error) {
          console.error("Failed to load checkpoints:", error);
        }
      },

      loadAirports: async () => {
        try {
          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 100));
          // Load airports data
          set({ airports: airportsData as any[] });
        } catch (error) {
          console.error("Failed to load airports:", error);
        }
      },

      loadSecurityPoints: async () => {
        try {
          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 100));
          // Load security points data
          set({ securityPoints: securityPointsData as any[] });
        } catch (error) {
          console.error("Failed to load security points:", error);
        }
      },

      // Truck management actions
      updateTruckPosition: (truckId: string, position: Position) => {
        set((state) => ({
          trucks: state.trucks.map((truck) =>
            truck.id === truckId
              ? {
                  ...truck,
                  currentPosition: position,
                  lastUpdate: new Date().toISOString(),
                }
              : truck
          ),
          lastUpdate: new Date().toISOString(),
        }));
      },

      updateTruckStatus: (truckId: string, status: Truck["status"]) => {
        set((state) => ({
          trucks: state.trucks.map((truck) =>
            truck.id === truckId
              ? {
                  ...truck,
                  status,
                  lastUpdate: new Date().toISOString(),
                }
              : truck
          ),
          lastUpdate: new Date().toISOString(),
        }));
      },

      addAlert: (truckId: string, alert: Alert) => {
        set((state) => ({
          trucks: state.trucks.map((truck) =>
            truck.id === truckId
              ? {
                  ...truck,
                  alerts: [...truck.alerts, alert],
                  lastUpdate: new Date().toISOString(),
                }
              : truck
          ),
          lastUpdate: new Date().toISOString(),
        }));
      },

      removeAlert: (truckId: string, alertId: string) => {
        set((state) => ({
          trucks: state.trucks.map((truck) =>
            truck.id === truckId
              ? {
                  ...truck,
                  alerts: truck.alerts.filter(
                    (_, index) => index.toString() !== alertId
                  ),
                  lastUpdate: new Date().toISOString(),
                }
              : truck
          ),
          lastUpdate: new Date().toISOString(),
        }));
      },

      // Filtering actions
      setFilters: (filters: Partial<TruckFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      setTruckFilters: (filters: Partial<TruckFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      setAlertFilters: (filters: Partial<AlertFilters>) => {
        set((state) => ({
          alertFilters: { ...state.alertFilters, ...filters },
        }));
      },

      clearFilters: () => {
        set({ filters: initialState.filters });
      },

      // UI actions
      selectTruck: (truckId: string | null) => {
        set((state) => ({
          ui: { ...state.ui, selectedTruckId: truckId },
        }));
      },

      setMapViewport: (viewport: Partial<MapViewport>) => {
        set((state) => ({
          ui: {
            ...state.ui,
            mapViewport: { ...state.ui.mapViewport, ...viewport },
          },
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
        }));
      },

      toggleFilterPanel: () => {
        set((state) => ({
          ui: { ...state.ui, filterPanelOpen: !state.ui.filterPanelOpen },
        }));
      },

      toggleAlertPanel: () => {
        set((state) => ({
          ui: { ...state.ui, alertPanelOpen: !state.ui.alertPanelOpen },
        }));
      },

      toggleMapLayer: (layer: string) => {
        set((state) => {
          const newUi = { ...state.ui };
          switch (layer) {
            case "routes":
              newUi.showRoutes = !newUi.showRoutes;
              break;
            case "checkpoints":
              newUi.showCheckpoints = !newUi.showCheckpoints;
              break;
            case "airports":
              newUi.showAirports = !newUi.showAirports;
              break;
            case "securityPoints":
              newUi.showSecurityPoints = !newUi.showSecurityPoints;
              break;
          }
          return { ui: newUi };
        });
      },

      setTheme: (theme: "light" | "dark") => {
        set((state) => ({
          ui: { ...state.ui, theme },
        }));
      },

      // Utility actions
      setLoading: (isLoading: boolean) => {
        console.log("🔄 Store: setLoading called with:", isLoading);
        set({ isLoading });
        console.log("🔄 Store: isLoading set to:", isLoading);
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Animation actions
      startTruckAnimation: (
        truckId: string,
        targetPosition: Position,
        duration = 2000
      ) => {
        set((state) => {
          const animations = [
            ...state.animations.filter((anim) => anim.truckId !== truckId),
            {
              truckId,
              currentPosition:
                state.trucks.find((t) => t.id === truckId)?.currentPosition ||
                targetPosition,
              targetPosition,
              progress: 0,
              duration,
              startTime: Date.now(),
              isActive: true,
            },
          ];
          return { animations };
        });
      },

      updateAnimations: () => {
        const now = Date.now();
        set((state) => {
          const updatedAnimations = state.animations
            .map((anim) => {
              if (!anim.isActive) return anim;

              const elapsed = now - anim.startTime;
              const progress = Math.min(elapsed / anim.duration, 1);

              // Interpolate position
              const lat =
                anim.currentPosition.lat +
                (anim.targetPosition.lat - anim.currentPosition.lat) * progress;
              const lng =
                anim.currentPosition.lng +
                (anim.targetPosition.lng - anim.currentPosition.lng) * progress;

              return {
                ...anim,
                progress,
                isActive: progress < 1,
              };
            })
            .filter((anim) => anim.isActive);

          // Update truck positions based on animations
          const updatedTrucks = state.trucks.map((truck) => {
            const animation = updatedAnimations.find(
              (anim) => anim.truckId === truck.id
            );
            if (animation) {
              const lat =
                animation.currentPosition.lat +
                (animation.targetPosition.lat - animation.currentPosition.lat) *
                  animation.progress;
              const lng =
                animation.currentPosition.lng +
                (animation.targetPosition.lng - animation.currentPosition.lng) *
                  animation.progress;

              return {
                ...truck,
                currentPosition: {
                  lat,
                  lng,
                  timestamp: new Date().toISOString(),
                },
              };
            }
            return truck;
          });

          return {
            animations: updatedAnimations,
            trucks: updatedTrucks,
          };
        });
      },

      stopTruckAnimation: (truckId: string) => {
        set((state) => ({
          animations: state.animations.filter(
            (anim) => anim.truckId !== truckId
          ),
        }));
      },
    }),
    {
      name: "truck-store", // Name for devtools
      partialize: (state: TruckStore) => ({
        // Only persist UI preferences and filters
        ui: {
          theme: state.ui.theme,
          sidebarOpen: state.ui.sidebarOpen,
          showRoutes: state.ui.showRoutes,
          showCheckpoints: state.ui.showCheckpoints,
          showAirports: state.ui.showAirports,
          showSecurityPoints: state.ui.showSecurityPoints,
        },
        filters: state.filters,
      }),
    }
  )
);

// Stable selector functions to prevent infinite loops
const selectTrucks = (state: TruckStore) => state.trucks;
const selectFilters = (state: TruckStore) => state.filters;
const selectSelectedTruckId = (state: TruckStore) => state.ui.selectedTruckId;

// Selector hooks for better performance and reusability
export const useSelectedTruck = () => {
  const trucks = useTruckStore(selectTrucks);
  const selectedId = useTruckStore(selectSelectedTruckId);

  return useMemo(() => {
    return selectedId
      ? trucks.find((truck) => truck.id === selectedId) || null
      : null;
  }, [trucks, selectedId]);
};

export const useFilteredTrucks = () => {
  const trucks = useTruckStore(selectTrucks);
  const filters = useTruckStore(selectFilters);

  return useMemo(() => {
    return trucks.filter((truck) => {
      // Origin filter
      if (filters.origin && truck.origin.name !== filters.origin) {
        return false;
      }

      // Destination filter
      if (
        filters.destination &&
        truck.destination.name !== filters.destination
      ) {
        return false;
      }

      // Route filter
      if (filters.route && truck.route !== filters.route) {
        return false;
      }

      // Status filter
      if (
        filters.status &&
        filters.status.length > 0 &&
        !filters.status.includes(truck.status)
      ) {
        return false;
      }

      // Company filter
      if (
        filters.company &&
        filters.company.length > 0 &&
        !filters.company.includes(truck.company)
      ) {
        return false;
      }

      // Truck type filter
      if (
        filters.truckType &&
        filters.truckType.length > 0 &&
        !filters.truckType.includes(truck.truckType)
      ) {
        return false;
      }

      // Has alerts filter
      if (filters.hasAlerts !== undefined) {
        const hasAlerts = truck.alerts.length > 0;
        if (filters.hasAlerts !== hasAlerts) {
          return false;
        }
      }

      // Alert types filter
      if (filters.alertTypes && filters.alertTypes.length > 0) {
        const truckAlertTypes = truck.alerts.map((alert) => alert.type);
        const hasMatchingAlert = filters.alertTypes.some((type) =>
          truckAlertTypes.includes(type)
        );
        if (!hasMatchingAlert) {
          return false;
        }
      }

      return true;
    });
  }, [trucks, filters]);
};

export const useTruckStats = () => {
  const trucks = useTruckStore(selectTrucks);

  return useMemo(() => {
    return {
      total: trucks.length,
      moving: trucks.filter((t) => t.status === "moving").length,
      stopped: trucks.filter((t) => t.status === "stopped").length,
      completed: trucks.filter((t) => t.status === "completed").length,
      withAlerts: trucks.filter((t) => t.alerts.length > 0).length,
      averageSpeed:
        trucks.reduce((sum, t) => sum + t.speed, 0) / trucks.length || 0,
    };
  }, [trucks]);
};

export const useAlertStats = () => {
  const trucks = useTruckStore(selectTrucks);

  return useMemo(() => {
    const allAlerts = trucks.flatMap((truck) => truck.alerts);

    const stats = {
      speed: { count: 0, critical: 0, warning: 0, info: 0 },
      lock: { count: 0, critical: 0, warning: 0, info: 0 },
      direction: { count: 0, critical: 0, warning: 0, info: 0 },
      stop: { count: 0, critical: 0, warning: 0, info: 0 },
      battery: { count: 0, critical: 0, warning: 0, info: 0 },
      fuel: { count: 0, critical: 0, warning: 0, info: 0 },
      temperature: { count: 0, critical: 0, warning: 0, info: 0 },
    };

    allAlerts.forEach((alert) => {
      if (stats[alert.type]) {
        stats[alert.type].count++;
        stats[alert.type][alert.severity]++;
      }
    });

    return stats;
  }, [trucks]);
};
