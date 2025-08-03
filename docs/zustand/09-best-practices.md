# Best Practices and Patterns

## Overview

This document outlines best practices, common patterns, and recommendations for using Zustand effectively in production applications, based on real-world experience and community guidelines.

## Store Design Best Practices

### 1. Keep Stores Focused and Small

```typescript
// ✅ Good - focused store
interface UserStore {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

// ❌ Bad - too many responsibilities
interface MegaStore {
  user: User | null
  trucks: Truck[]
  ui: UIState
  notifications: Notification[]
  settings: Settings
  // ... too many concerns
}
```

### 2. Use Clear Naming Conventions

```typescript
// ✅ Good naming
interface TruckStore {
  // State (nouns)
  trucks: Truck[]
  selectedTruckId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions (verbs)
  loadTrucks: () => Promise<void>
  selectTruck: (id: string) => void
  updateTruckPosition: (id: string, position: Position) => void
  clearError: () => void
}

// ❌ Bad naming
interface BadStore {
  data: any[] // Too generic
  thing: string // Unclear
  doStuff: () => void // Not descriptive
  flag: boolean // What flag?
}
```

### 3. Organize State Logically

```typescript
// ✅ Good - grouped related state
interface TruckStore {
  // Core data
  trucks: Truck[]
  routes: Route[]
  
  // UI state
  ui: {
    selectedTruckId: string | null
    sidebarOpen: boolean
    mapViewport: MapViewport
  }
  
  // Loading states
  loading: {
    trucks: boolean
    routes: boolean
  }
  
  // Error states
  errors: {
    trucks: string | null
    routes: string | null
  }
}
```

## Action Design Patterns

### 1. Consistent Action Patterns

```typescript
// ✅ Good - consistent async action pattern
const useTruckStore = create<TruckStore>((set, get) => ({
  trucks: [],
  isLoading: false,
  error: null,
  
  // Consistent async pattern
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
  },
  
  updateTruck: async (id: string, updates: Partial<Truck>) => {
    set({ isLoading: true, error: null })
    try {
      const updatedTruck = await updateTruckAPI(id, updates)
      set((state) => ({
        trucks: state.trucks.map(truck =>
          truck.id === id ? updatedTruck : truck
        ),
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update truck',
        isLoading: false 
      })
    }
  }
}))
```

### 2. Batch Related Updates

```typescript
// ✅ Good - batch related updates
const selectTruckAndShowDetails = (truckId: string) => {
  set((state) => ({
    selectedTruckId: truckId,
    ui: {
      ...state.ui,
      sidebarOpen: true,
      detailsPanelOpen: true
    },
    lastAction: 'selectTruck',
    timestamp: Date.now()
  }))
}

// ❌ Bad - multiple separate updates
const badSelectTruck = (truckId: string) => {
  set({ selectedTruckId: truckId })
  set((state) => ({ ui: { ...state.ui, sidebarOpen: true } }))
  set((state) => ({ ui: { ...state.ui, detailsPanelOpen: true } }))
}
```

### 3. Use Meaningful Action Names for DevTools

```typescript
// ✅ Good - descriptive action names
const useTruckStore = create<TruckStore>()(
  devtools(
    (set, get) => ({
      selectTruck: (id: string) => 
        set({ selectedTruckId: id }, false, 'selectTruck'),
      
      updateTruckPosition: (id: string, position: Position) =>
        set((state) => ({
          trucks: state.trucks.map(truck =>
            truck.id === id ? { ...truck, currentPosition: position } : truck
          )
        }), false, `updateTruckPosition/${id}`)
    }),
    { name: 'truck-store' }
  )
)
```

## Performance Best Practices

### 1. Use Selective Subscriptions

```typescript
// ✅ Good - selective subscriptions
function TruckCount() {
  const count = useTruckStore(state => state.trucks.length)
  return <div>Total: {count}</div>
}

function TruckStatus({ truckId }: { truckId: string }) {
  const status = useTruckStore(state => 
    state.trucks.find(t => t.id === truckId)?.status
  )
  return <div>Status: {status}</div>
}

// ❌ Bad - subscribes to entire store
function BadComponent() {
  const store = useTruckStore() // Re-renders on any change
  return <div>Total: {store.trucks.length}</div>
}
```

### 2. Memoize Complex Selectors

```typescript
// ✅ Good - memoized selector
export const useFilteredTrucks = () => {
  const trucks = useTruckStore(state => state.trucks)
  const filters = useTruckStore(state => state.filters)
  
  return useMemo(() => 
    trucks.filter(truck => matchesFilters(truck, filters)),
    [trucks, filters]
  )
}

// ✅ Good - stable selector functions
const selectTrucks = (state: TruckStore) => state.trucks
const selectFilters = (state: TruckStore) => state.filters

export const useFilteredTrucks = () => {
  const trucks = useTruckStore(selectTrucks)
  const filters = useTruckStore(selectFilters)
  
  return useMemo(() => 
    trucks.filter(truck => matchesFilters(truck, filters)),
    [trucks, filters]
  )
}
```

### 3. Use Shallow Comparison When Appropriate

```typescript
import { shallow } from 'zustand/shallow'

// ✅ Good - shallow comparison for objects
const useUIState = () => useTruckStore(
  state => ({
    theme: state.ui.theme,
    sidebarOpen: state.ui.sidebarOpen,
    selectedTruckId: state.ui.selectedTruckId
  }),
  shallow
)
```

## TypeScript Best Practices

### 1. Define Clear Interfaces

```typescript
// ✅ Good - clear separation of concerns
interface TruckState {
  trucks: Truck[]
  selectedTruckId: string | null
  isLoading: boolean
  error: string | null
}

interface TruckActions {
  loadTrucks: () => Promise<void>
  selectTruck: (id: string) => void
  updateTruck: (id: string, updates: Partial<Truck>) => void
  clearError: () => void
}

type TruckStore = TruckState & TruckActions
```

### 2. Use Generic Constraints

```typescript
// ✅ Good - generic store factory with constraints
interface Entity {
  id: string
  createdAt: string
  updatedAt: string
}

function createEntityStore<T extends Entity>(
  fetchFn: () => Promise<T[]>,
  updateFn: (id: string, updates: Partial<T>) => Promise<T>
) {
  return create<EntityStore<T>>((set, get) => ({
    items: [],
    selectedId: null,
    
    loadItems: async () => {
      const items = await fetchFn()
      set({ items })
    },
    
    updateItem: async (id: string, updates: Partial<T>) => {
      const updated = await updateFn(id, updates)
      set((state) => ({
        items: state.items.map(item =>
          item.id === id ? updated : item
        )
      }))
    }
  }))
}
```

### 3. Provide Type-Safe Selectors

```typescript
// ✅ Good - type-safe selector helpers
export const createSelector = <T, R>(
  selector: (state: T) => R
) => selector

// Usage
const selectTruckById = createSelector((state: TruckStore) => 
  (id: string) => state.trucks.find(truck => truck.id === id)
)

const useTruckById = (id: string) => 
  useTruckStore(state => selectTruckById(state)(id))
```

## Error Handling Best Practices

### 1. Consistent Error Handling

```typescript
// ✅ Good - consistent error handling pattern
const createAsyncAction = <T>(
  actionName: string,
  asyncFn: () => Promise<T>,
  onSuccess: (data: T) => void
) => async () => {
  set({ isLoading: true, error: null })
  
  try {
    const data = await asyncFn()
    onSuccess(data)
    set({ isLoading: false })
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : `Failed to ${actionName}`
    
    set({ 
      error: errorMessage, 
      isLoading: false 
    })
    
    // Log error for monitoring
    console.error(`${actionName} failed:`, error)
  }
}
```

### 2. Error Recovery Patterns

```typescript
// ✅ Good - error recovery
const useTruckStore = create<TruckStore>((set, get) => ({
  trucks: [],
  error: null,
  retryCount: 0,
  
  loadTrucks: async () => {
    const maxRetries = 3
    const { retryCount } = get()
    
    if (retryCount >= maxRetries) {
      set({ error: 'Max retries exceeded. Please refresh the page.' })
      return
    }
    
    try {
      const trucks = await fetchTrucks()
      set({ trucks, error: null, retryCount: 0 })
    } catch (error) {
      set({ 
        error: error.message,
        retryCount: retryCount + 1
      })
      
      // Auto-retry with exponential backoff
      setTimeout(() => {
        get().loadTrucks()
      }, Math.pow(2, retryCount) * 1000)
    }
  },
  
  clearError: () => set({ error: null, retryCount: 0 })
}))
```

## Testing Best Practices

### 1. Test Store Logic Separately

```typescript
// ✅ Good - test store logic
describe('TruckStore', () => {
  beforeEach(() => {
    useTruckStore.setState({
      trucks: [],
      selectedTruckId: null,
      isLoading: false,
      error: null
    })
  })
  
  it('should select truck correctly', () => {
    const mockTrucks = [
      { id: '1', plateNumber: 'ABC-123' },
      { id: '2', plateNumber: 'DEF-456' }
    ]
    
    useTruckStore.setState({ trucks: mockTrucks })
    useTruckStore.getState().selectTruck('1')
    
    expect(useTruckStore.getState().selectedTruckId).toBe('1')
  })
  
  it('should handle loading states', async () => {
    const mockFetch = jest.fn().mockResolvedValue([])
    
    await useTruckStore.getState().loadTrucks()
    
    expect(useTruckStore.getState().isLoading).toBe(false)
  })
})
```

### 2. Mock Store for Component Tests

```typescript
// ✅ Good - mock store for components
const createMockStore = (initialState: Partial<TruckStore> = {}) => {
  return create<TruckStore>(() => ({
    trucks: [],
    selectedTruckId: null,
    isLoading: false,
    error: null,
    loadTrucks: jest.fn(),
    selectTruck: jest.fn(),
    ...initialState
  }))
}

describe('TruckList Component', () => {
  it('should display trucks', () => {
    const mockTrucks = [{ id: '1', plateNumber: 'ABC-123' }]
    const mockStore = createMockStore({ trucks: mockTrucks })
    
    render(<TruckList />, {
      wrapper: ({ children }) => (
        <StoreProvider store={mockStore}>
          {children}
        </StoreProvider>
      )
    })
    
    expect(screen.getByText('ABC-123')).toBeInTheDocument()
  })
})
```

## Security Best Practices

### 1. Validate Data

```typescript
// ✅ Good - validate incoming data
const validateTruck = (data: unknown): data is Truck => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'plateNumber' in data &&
    'currentPosition' in data
  )
}

const loadTrucks = async () => {
  try {
    const response = await fetch('/api/trucks')
    const data = await response.json()
    
    if (Array.isArray(data) && data.every(validateTruck)) {
      set({ trucks: data })
    } else {
      throw new Error('Invalid truck data received')
    }
  } catch (error) {
    set({ error: 'Failed to load trucks' })
  }
}
```

### 2. Sanitize User Input

```typescript
// ✅ Good - sanitize input
const setSearchQuery = (query: string) => {
  // Sanitize input
  const sanitizedQuery = query
    .trim()
    .slice(0, 100) // Limit length
    .replace(/[<>]/g, '') // Remove potential XSS
  
  set({ searchQuery: sanitizedQuery })
}
```

## Production Deployment Best Practices

### 1. Environment Configuration

```typescript
// ✅ Good - environment-specific config
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    enableDevtools: true,
    logLevel: 'debug'
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL,
    enableDevtools: false,
    logLevel: 'error'
  }
}

const currentConfig = config[process.env.NODE_ENV as keyof typeof config]

const useTruckStore = create<TruckStore>()(
  currentConfig.enableDevtools
    ? devtools(storeImplementation, { name: 'truck-store' })
    : storeImplementation
)
```

### 2. Performance Monitoring

```typescript
// ✅ Good - performance monitoring
const performanceMiddleware = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  const performanceSet: typeof set = (...args) => {
    const start = performance.now()
    set(...args)
    const end = performance.now()
    
    const duration = end - start
    if (duration > 10) {
      console.warn(`Slow store update: ${duration}ms`)
      
      // Send to monitoring service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'slow_store_update', {
          duration: Math.round(duration),
          action: args[2] || 'unknown'
        })
      }
    }
  }
  
  return f(performanceSet, get, store)
}
```

## Common Anti-Patterns to Avoid

### 1. Don't Mutate State Directly

```typescript
// ❌ Bad - direct mutation
const badAddTruck = (truck: Truck) => {
  const state = get()
  state.trucks.push(truck) // Mutation!
  set(state)
}

// ✅ Good - immutable update
const goodAddTruck = (truck: Truck) => {
  set((state) => ({
    trucks: [...state.trucks, truck]
  }))
}
```

### 2. Don't Create Objects in Selectors

```typescript
// ❌ Bad - creates new object every time
const useBadSelector = () => useTruckStore(state => ({
  ...state.truck, // New object reference
  displayName: `${state.truck.plateNumber} - ${state.truck.company}`
}))

// ✅ Good - use useMemo for derived objects
const useGoodSelector = () => {
  const truck = useTruckStore(state => state.truck)
  return useMemo(() => ({
    ...truck,
    displayName: `${truck.plateNumber} - ${truck.company}`
  }), [truck])
}
```

### 3. Don't Use Stores for Everything

```typescript
// ❌ Bad - storing local component state in global store
const useFormStore = create((set) => ({
  inputValue: '',
  setInputValue: (value: string) => set({ inputValue: value })
}))

// ✅ Good - use local state for component-specific data
function MyForm() {
  const [inputValue, setInputValue] = useState('')
  // Only use global store for truly global state
}
```

## Summary Checklist

### Store Design
- [ ] Keep stores focused and small
- [ ] Use clear naming conventions
- [ ] Organize state logically
- [ ] Separate state and actions

### Performance
- [ ] Use selective subscriptions
- [ ] Memoize complex selectors
- [ ] Use stable selector functions
- [ ] Apply shallow comparison when needed

### TypeScript
- [ ] Define clear interfaces
- [ ] Use generic constraints
- [ ] Provide type-safe selectors
- [ ] Leverage type inference

### Error Handling
- [ ] Implement consistent error patterns
- [ ] Provide error recovery mechanisms
- [ ] Log errors for monitoring
- [ ] Handle edge cases gracefully

### Testing
- [ ] Test store logic separately
- [ ] Mock stores for component tests
- [ ] Test error scenarios
- [ ] Verify performance characteristics

### Security
- [ ] Validate incoming data
- [ ] Sanitize user input
- [ ] Implement proper authentication
- [ ] Follow security best practices

### Production
- [ ] Configure for different environments
- [ ] Implement performance monitoring
- [ ] Set up error tracking
- [ ] Optimize bundle size

Following these best practices will help you build maintainable, performant, and reliable applications with Zustand.
