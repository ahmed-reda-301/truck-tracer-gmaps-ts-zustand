# Application Architecture

## Overview

This document describes the architecture of the Truck Tracking application, explaining how different components work together and the design decisions behind the implementation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Truck Tracker App                        │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Dashboard     │ │   Map View      │ │   Filters    │  │
│  │   Components    │ │   Components    │ │   Panel      │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  State Management Layer (Zustand)                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Truck Store   │ │   UI Store      │ │   Filter     │  │
│  │   (Global)      │ │   (Global)      │ │   Store      │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   JSON Data     │ │   API Services  │ │   Real-time  │  │
│  │   Files         │ │   (Future)      │ │   Updates    │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Google Maps   │ │   WebSocket     │ │   Browser    │  │
│  │   API           │ │   (Future)      │ │   Storage    │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/           # React components
│   ├── Dashboard/       # Dashboard-related components
│   ├── Map/            # Map-related components
│   ├── Filters/        # Filter components
│   ├── Trucks/         # Truck-related components
│   └── UI/             # Reusable UI components
├── store/              # Zustand stores
│   ├── truckStore.ts   # Main truck state management
│   ├── uiStore.ts      # UI state management
│   └── filterStore.ts  # Filter state management
├── types/              # TypeScript type definitions
│   ├── index.ts        # Main types export
│   ├── truck.ts        # Truck-related types
│   ├── map.ts          # Map-related types
│   └── api.ts          # API-related types
├── data/               # Static data files
│   ├── trucks.json     # Sample truck data
│   ├── routes.json     # Route definitions
│   ├── checkpoints.json # Checkpoint data
│   └── alerts.json     # Alert configurations
├── services/           # External service integrations
│   ├── api.ts          # API service layer
│   ├── websocket.ts    # WebSocket connections
│   └── maps.ts         # Google Maps integration
├── utils/              # Utility functions
│   ├── calculations.ts # Distance, speed calculations
│   ├── formatting.ts   # Data formatting utilities
│   └── validation.ts   # Data validation
├── hooks/              # Custom React hooks
│   ├── useRealTime.ts  # Real-time data updates
│   ├── useGeolocation.ts # Geolocation utilities
│   └── useLocalStorage.ts # Local storage management
└── constants/          # Application constants
    ├── config.ts       # Configuration values
    ├── routes.ts       # Route definitions
    └── themes.ts       # Theme configurations
```

## Component Architecture

### 1. Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── Navigation
│   └── UserMenu
├── MainLayout
│   ├── Sidebar
│   │   ├── TruckList
│   │   ├── FilterPanel
│   │   └── AlertPanel
│   ├── MapView
│   │   ├── GoogleMap
│   │   ├── TruckMarkers
│   │   ├── RoutePolylines
│   │   └── InfoWindow
│   └── Dashboard
│       ├── StatsCards
│       ├── AlertSummary
│       └── RecentActivity
└── Footer
```

### 2. Component Responsibilities

#### Presentation Components
```typescript
// Pure components that only handle UI rendering
interface TruckItemProps {
  truck: Truck
  isSelected: boolean
  onSelect: (id: string) => void
}

const TruckItem: React.FC<TruckItemProps> = ({ truck, isSelected, onSelect }) => {
  return (
    <div 
      className={`truck-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(truck.id)}
    >
      <h3>{truck.plateNumber}</h3>
      <p>{truck.status}</p>
    </div>
  )
}
```

#### Container Components
```typescript
// Components that connect to stores and manage state
const TruckListContainer: React.FC = () => {
  const { trucks, selectedTruckId, selectTruck } = useTruckStore()
  const filteredTrucks = useFilteredTrucks()
  
  return (
    <div className="truck-list">
      {filteredTrucks.map(truck => (
        <TruckItem
          key={truck.id}
          truck={truck}
          isSelected={selectedTruckId === truck.id}
          onSelect={selectTruck}
        />
      ))}
    </div>
  )
}
```

## State Management Architecture

### 1. Store Organization

#### Main Truck Store
```typescript
interface TruckStore {
  // Core Data
  trucks: Truck[]
  routes: Route[]
  checkpoints: Checkpoint[]
  
  // UI State
  selectedTruckId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  loadTrucks: () => Promise<void>
  selectTruck: (id: string) => void
  updateTruckPosition: (id: string, position: Position) => void
  
  // Computed/Derived State (via selectors)
  getFilteredTrucks: () => Truck[]
  getTruckStats: () => TruckStats
  getAlertSummary: () => AlertSummary
}
```

#### UI Store (Separate for Performance)
```typescript
interface UIStore {
  // Layout State
  sidebarOpen: boolean
  filterPanelOpen: boolean
  alertPanelOpen: boolean
  
  // Map State
  mapViewport: MapViewport
  selectedLayers: string[]
  
  // Theme State
  theme: 'light' | 'dark'
  
  // Actions
  toggleSidebar: () => void
  setMapViewport: (viewport: MapViewport) => void
  setTheme: (theme: 'light' | 'dark') => void
}
```

### 2. Data Flow

```
User Action → Component → Store Action → State Update → Component Re-render
     ↓              ↓           ↓            ↓              ↓
Click Truck → TruckItem → selectTruck() → selectedTruckId → Highlight Truck
```

### 3. Selector Pattern

```typescript
// Efficient selectors prevent unnecessary re-renders
export const useSelectedTruck = () => 
  useTruckStore(state => {
    const selectedId = state.selectedTruckId
    return selectedId ? state.trucks.find(t => t.id === selectedId) : null
  })

export const useFilteredTrucks = () =>
  useTruckStore(state => {
    const { trucks, filters } = state
    return trucks.filter(truck => matchesFilters(truck, filters))
  })
```

## Data Layer Architecture

### 1. Data Sources

#### Static Data (Development)
```typescript
// JSON files for development and testing
import trucksData from '../data/trucks.json'
import routesData from '../data/routes.json'

// Type-safe data loading
const loadStaticData = (): Promise<Truck[]> => {
  return Promise.resolve(trucksData as Truck[])
}
```

#### API Integration (Future)
```typescript
// RESTful API service
class TruckAPI {
  private baseURL = process.env.REACT_APP_API_URL
  
  async getTrucks(): Promise<Truck[]> {
    const response = await fetch(`${this.baseURL}/trucks`)
    return response.json()
  }
  
  async updateTruck(id: string, updates: Partial<Truck>): Promise<Truck> {
    const response = await fetch(`${this.baseURL}/trucks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return response.json()
  }
}
```

#### Real-time Updates (Future)
```typescript
// WebSocket integration for real-time updates
class TruckWebSocket {
  private ws: WebSocket
  
  constructor(url: string) {
    this.ws = new WebSocket(url)
    this.setupEventHandlers()
  }
  
  private setupEventHandlers() {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'TRUCK_POSITION_UPDATE':
          useTruckStore.getState().updateTruckPosition(data.truckId, data.position)
          break
        case 'TRUCK_STATUS_UPDATE':
          useTruckStore.getState().updateTruckStatus(data.truckId, data.status)
          break
      }
    }
  }
}
```

### 2. Data Transformation

```typescript
// Transform raw API data to application format
const transformTruckData = (apiTruck: APITruck): Truck => ({
  id: apiTruck.truck_id,
  plateNumber: apiTruck.plate_number,
  driverName: apiTruck.driver_name,
  currentPosition: {
    lat: parseFloat(apiTruck.latitude),
    lng: parseFloat(apiTruck.longitude),
    timestamp: apiTruck.last_update
  },
  status: mapAPIStatus(apiTruck.status),
  alerts: apiTruck.alerts.map(transformAlert)
})
```

## Performance Architecture

### 1. Component Optimization

```typescript
// Memoized components prevent unnecessary re-renders
const TruckItem = React.memo<TruckItemProps>(({ truck, isSelected, onSelect }) => {
  return (
    <div onClick={() => onSelect(truck.id)}>
      {truck.plateNumber} - {truck.status}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.truck.id === nextProps.truck.id &&
    prevProps.truck.status === nextProps.truck.status &&
    prevProps.isSelected === nextProps.isSelected
  )
})
```

### 2. State Optimization

```typescript
// Selective subscriptions minimize re-renders
const TruckCount = () => {
  // Only re-renders when truck count changes
  const count = useTruckStore(state => state.trucks.length)
  return <div>Total Trucks: {count}</div>
}

const TruckStatus = ({ truckId }: { truckId: string }) => {
  // Only re-renders when specific truck's status changes
  const status = useTruckStore(state => 
    state.trucks.find(t => t.id === truckId)?.status
  )
  return <div>Status: {status}</div>
}
```

### 3. Data Loading Optimization

```typescript
// Lazy loading and caching
const useTruckData = () => {
  const { trucks, loadTrucks, isLoading } = useTruckStore()
  
  useEffect(() => {
    if (trucks.length === 0 && !isLoading) {
      loadTrucks()
    }
  }, [trucks.length, isLoading, loadTrucks])
  
  return { trucks, isLoading }
}
```

## Error Handling Architecture

### 1. Store-Level Error Handling

```typescript
const useTruckStore = create<TruckStore>((set, get) => ({
  error: null,
  
  loadTrucks: async () => {
    set({ isLoading: true, error: null })
    try {
      const trucks = await fetchTrucks()
      set({ trucks, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load trucks',
        isLoading: false 
      })
    }
  }
}))
```

### 2. Component-Level Error Boundaries

```typescript
class TruckErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Truck component error:', error, errorInfo)
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with the truck display</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## Testing Architecture

### 1. Store Testing

```typescript
describe('TruckStore', () => {
  beforeEach(() => {
    // Reset store state
    useTruckStore.setState({
      trucks: [],
      selectedTruckId: null,
      isLoading: false,
      error: null
    })
  })
  
  it('should load trucks successfully', async () => {
    const mockTrucks = [{ id: '1', plateNumber: 'ABC-123' }]
    jest.spyOn(api, 'fetchTrucks').mockResolvedValue(mockTrucks)
    
    await useTruckStore.getState().loadTrucks()
    
    expect(useTruckStore.getState().trucks).toEqual(mockTrucks)
    expect(useTruckStore.getState().isLoading).toBe(false)
  })
})
```

### 2. Component Testing

```typescript
describe('TruckItem', () => {
  it('should call onSelect when clicked', () => {
    const mockTruck = { id: '1', plateNumber: 'ABC-123', status: 'moving' }
    const mockOnSelect = jest.fn()
    
    render(
      <TruckItem 
        truck={mockTruck} 
        isSelected={false} 
        onSelect={mockOnSelect} 
      />
    )
    
    fireEvent.click(screen.getByText('ABC-123'))
    expect(mockOnSelect).toHaveBeenCalledWith('1')
  })
})
```

## Deployment Architecture

### 1. Build Configuration

```typescript
// Environment-specific configurations
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    websocketUrl: 'ws://localhost:3001',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_DEV_KEY
  },
  production: {
    apiUrl: 'https://api.trucktracker.com',
    websocketUrl: 'wss://api.trucktracker.com',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_PROD_KEY
  }
}
```

### 2. Performance Monitoring

```typescript
// Performance monitoring integration
const performanceMiddleware = (set, get, store) => {
  const originalSet = set
  
  return (...args) => {
    const start = performance.now()
    originalSet(...args)
    const end = performance.now()
    
    // Log slow operations
    if (end - start > 10) {
      console.warn(`Slow store update: ${end - start}ms`)
    }
  }
}
```

## Security Considerations

### 1. Data Validation

```typescript
// Validate incoming data
const validateTruckData = (data: unknown): data is Truck => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'plateNumber' in data &&
    'currentPosition' in data
  )
}
```

### 2. API Security

```typescript
// Secure API calls
const secureApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  return fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
}
```

## Future Enhancements

1. **Real-time WebSocket Integration**
2. **Offline Support with Service Workers**
3. **Advanced Filtering and Search**
4. **Route Optimization Algorithms**
5. **Mobile App with React Native**
6. **Machine Learning for Predictive Analytics**
7. **Multi-tenant Support**
8. **Advanced Reporting and Analytics**

This architecture provides a solid foundation for the truck tracking application while remaining flexible for future enhancements and scalability requirements.
