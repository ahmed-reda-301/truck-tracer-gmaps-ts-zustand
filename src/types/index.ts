// Core data types for the truck tracking application

export interface Position {
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface Alert {
  id: string;
  truckId: string;
  truckPlateNumber: string;
  truckDriverName: string;
  type:
    | "speed"
    | "lock"
    | "direction"
    | "stop"
    | "battery"
    | "fuel"
    | "temperature";
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

export interface Cargo {
  type: string;
  weight: string;
  value: string;
  dangerous: boolean;
}

export interface Truck {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  company: string;
  truckType: string;
  capacity: string;
  currentPosition: Position;
  destination: Location;
  origin: Location;
  route: string;
  status: "moving" | "stopped" | "completed" | "delayed" | "maintenance";
  speed: number;
  heading: number; // Direction in degrees (0-360)
  fuel: number; // Percentage
  battery: number; // Percentage
  lastUpdate: string;
  alerts: Alert[];
  cargo: Cargo;
}

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type:
    | "origin"
    | "destination"
    | "checkpoint"
    | "rest_stop"
    | "hub"
    | "border"
    | "transit"
    | "junction";
  estimatedTime: string;
}

export interface RouteRestrictions {
  maxSpeed: number;
  dangerousGoods: boolean;
  nightDriving: boolean;
  weatherRestrictions: string[];
  requiresPermit?: boolean;
  refrigerated?: boolean;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  distance: number; // in kilometers
  estimatedTime: string;
  waypoints: Waypoint[];
  restrictions: RouteRestrictions;
  checkpoints: string[];
}

export interface Checkpoint {
  id: string;
  name: string;
  type:
    | "security"
    | "customs"
    | "weigh_station"
    | "inspection"
    | "border"
    | "border_control";
  location: Position;
  authority: string;
  operatingHours: {
    open: string;
    close: string;
    timezone: string;
  };
  services: string[];
  averageWaitTime: number; // in minutes
  isActive: boolean;
  contactInfo: {
    phone: string;
    radio: string;
    emergency: string;
  };
  alertLevel: "normal" | "elevated" | "high" | "critical";
}

export interface Airport {
  id: string;
  name: string;
  code: string; // IATA code
  location: Position;
  type: "international" | "domestic" | "military" | "private";
  runways: number;
  cargoCapacity: string;
  restrictions: {
    dangerousGoods: boolean;
    oversizeLoad: boolean;
    nightOperations: boolean;
  };
  operatingHours: {
    open: string;
    close: string;
    timezone: string;
  };
  contactInfo: {
    phone: string;
    cargo: string;
    emergency: string;
  };
  services: string[];
}

export interface SecurityPoint {
  id: string;
  name: string;
  type: "police_station" | "checkpoint" | "border_control" | "military_base";
  location: Position;
  authority: "ministry_interior" | "customs" | "military" | "traffic_police";
  jurisdiction: string;
  contactInfo: {
    phone: string;
    radio: string;
    emergency: string;
  };
  alertLevel: "normal" | "elevated" | "high" | "critical";
  isActive: boolean;
}

// Filter types
export interface TruckFilters {
  origin?: string;
  destination?: string;
  route?: string;
  status?: Truck["status"][];
  company?: string[];
  truckType?: string[];
  hasAlerts?: boolean;
  alertTypes?: Alert["type"][];
}

export interface AlertFilters {
  types: Alert["type"][];
  severities: Alert["severity"][];
  timeRange: {
    start: string;
    end: string;
  };
  truckIds?: string[];
}

// UI State types
export interface MapViewport {
  center: Position;
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface UIState {
  selectedTruckId: string | null;
  showRoutes: boolean;
  showCheckpoints: boolean;
  showAirports: boolean;
  showSecurityPoints: boolean;
  sidebarOpen: boolean;
  filterPanelOpen: boolean;
  alertPanelOpen: boolean;
  mapViewport: MapViewport;
  theme: "light" | "dark";
}

// Animation types
export interface TruckAnimation {
  truckId: string;
  currentPosition: Position;
  targetPosition: Position;
  progress: number;
  duration: number;
  startTime: number;
  isActive: boolean;
}

// Store state types
export interface TruckState {
  trucks: Truck[];
  routes: Route[];
  checkpoints: Checkpoint[];
  airports: Airport[];
  securityPoints: SecurityPoint[];
  filters: TruckFilters;
  alertFilters: AlertFilters;
  ui: UIState;
  animations: TruckAnimation[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

// Action types for better organization
export interface TruckActions {
  // Data loading
  loadTrucks: () => Promise<void>;
  loadRoutes: () => Promise<void>;
  loadCheckpoints: () => Promise<void>;
  loadAirports: () => Promise<void>;
  loadSecurityPoints: () => Promise<void>;

  // Truck management
  updateTruckPosition: (truckId: string, position: Position) => void;
  updateTruckStatus: (truckId: string, status: Truck["status"]) => void;
  addAlert: (truckId: string, alert: Alert) => void;
  removeAlert: (truckId: string, alertId: string) => void;

  // Realistic simulation
  updateTruckRealistic: (truckId: string) => void;
  updateAllMovingTrucks: () => void;

  // Filtering
  setFilters: (filters: Partial<TruckFilters>) => void;
  setTruckFilters: (filters: Partial<TruckFilters>) => void;
  setAlertFilters: (filters: Partial<AlertFilters>) => void;
  clearFilters: () => void;

  // UI actions
  selectTruck: (truckId: string | null) => void;
  setMapViewport: (viewport: Partial<MapViewport>) => void;
  toggleSidebar: () => void;
  toggleFilterPanel: () => void;
  toggleAlertPanel: () => void;
  toggleMapLayer: (layer: string) => void;
  setTheme: (theme: "light" | "dark") => void;

  // Animation actions
  startTruckAnimation: (
    truckId: string,
    targetPosition: Position,
    duration?: number
  ) => void;
  updateAnimations: () => void;
  stopTruckAnimation: (truckId: string) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Combined store type
export type TruckStore = TruckState & TruckActions;

// Computed/derived state types
export interface DerivedState {
  filteredTrucks: Truck[];
  activeTrucks: Truck[];
  trucksWithAlerts: Truck[];
  routeStats: {
    [routeId: string]: {
      totalTrucks: number;
      activeTrucks: number;
      averageSpeed: number;
      alerts: number;
    };
  };
  alertSummary: {
    [type in Alert["type"]]: {
      count: number;
      critical: number;
      warning: number;
      info: number;
    };
  };
}

// Real-time update types
export interface TruckUpdate {
  truckId: string;
  position?: Position;
  speed?: number;
  heading?: number;
  status?: Truck["status"];
  fuel?: number;
  battery?: number;
  alerts?: Alert[];
  timestamp: string;
}

export interface SimulationConfig {
  enabled: boolean;
  speed: number; // Simulation speed multiplier
  updateInterval: number; // milliseconds
  randomEvents: boolean;
  eventProbability: number; // 0-1
}

// Google Maps integration types
export interface MapMarker {
  id: string;
  position: Position;
  type: "truck" | "checkpoint" | "airport" | "security" | "waypoint";
  icon: string;
  title: string;
  data: any;
  visible: boolean;
}

export interface MapPolyline {
  id: string;
  path: Position[];
  color: string;
  weight: number;
  opacity: number;
  visible: boolean;
}

// Google Maps Component Props
export interface GoogleMapProps {
  center: Position;
  zoom: number;
  trucks: Truck[];
  selectedTruckId: string | null;
  routes: Route[];
  checkpoints: Checkpoint[];
  airports: Airport[];
  securityPoints: SecurityPoint[];
  showRoutes: boolean;
  showCheckpoints: boolean;
  showAirports: boolean;
  showSecurityPoints: boolean;
  onTruckSelect: (truckId: string) => void;
  onMapClick: (position: Position) => void;
}

export interface TruckMarkerProps {
  truck: Truck;
  isSelected: boolean;
  onClick: () => void;
}

export interface RoutePolylineProps {
  route: Route;
  isVisible: boolean;
  color?: string;
}

// Animation Types
export interface TruckAnimation {
  truckId: string;
  currentPosition: Position;
  targetPosition: Position;
  progress: number; // 0 to 1
  duration: number; // in milliseconds
  startTime: number;
  isActive: boolean;
}

// Enhanced Route with detailed path
export interface DetailedRoute extends Route {
  pathCoordinates: Position[];
}

// Map Layer Types
export type MapLayerType =
  | "trucks"
  | "routes"
  | "checkpoints"
  | "airports"
  | "security"
  | "traffic";

export interface MapLayer {
  id: MapLayerType;
  name: string;
  visible: boolean;
  icon: string;
  color: string;
}

// Filter Enhancement for Map
export interface MapFilters extends TruckFilters {
  showOnlyMoving?: boolean;
  showOnlyWithAlerts?: boolean;
  radiusFilter?: {
    center: Position;
    radius: number; // in kilometers
  };
}

// Export all types as a namespace for easier imports
export * from "./index";
