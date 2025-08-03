# Zustand vs Context API Comparison

## Overview

This document compares Zustand with React's built-in Context API, helping you understand when to use each approach for state management in React applications.

## Quick Comparison

| Aspect | Zustand | Context API |
|--------|---------|-------------|
| **Bundle Size** | 2.9kb | 0kb (built-in) |
| **Performance** | Excellent | Poor (without optimization) |
| **Setup Complexity** | Minimal | Medium |
| **Re-render Control** | Automatic | Manual optimization needed |
| **DevTools** | Yes | No |
| **Learning Curve** | Low | Low |
| **Use Case** | Global state | Tree-scoped state |

## Code Comparison

### Simple Counter Example

#### Zustand
```typescript
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 }))
}))

// Usage - no provider needed
function Counter() {
  const { count, increment, decrement } = useCounterStore()
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}

function App() {
  return <Counter /> // No wrapper needed
}
```

#### Context API
```typescript
import React, { createContext, useContext, useReducer, ReactNode } from 'react'

interface CounterState {
  count: number
}

interface CounterActions {
  increment: () => void
  decrement: () => void
}

const CounterContext = createContext<CounterState & CounterActions | null>(null)

interface CounterAction {
  type: 'INCREMENT' | 'DECREMENT'
}

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }
    case 'DECREMENT':
      return { count: state.count - 1 }
    default:
      return state
  }
}

function CounterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 })
  
  const increment = () => dispatch({ type: 'INCREMENT' })
  const decrement = () => dispatch({ type: 'DECREMENT' })
  
  return (
    <CounterContext.Provider value={{ ...state, increment, decrement }}>
      {children}
    </CounterContext.Provider>
  )
}

function useCounter() {
  const context = useContext(CounterContext)
  if (!context) {
    throw new Error('useCounter must be used within CounterProvider')
  }
  return context
}

// Usage - requires provider
function Counter() {
  const { count, increment, decrement } = useCounter()
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}

function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  )
}
```

### Complex State Example

#### Zustand
```typescript
interface TruckState {
  trucks: Truck[]
  selectedTruckId: string | null
  filters: TruckFilters
  isLoading: boolean
  error: string | null
}

interface TruckActions {
  loadTrucks: () => Promise<void>
  selectTruck: (id: string) => void
  setFilters: (filters: Partial<TruckFilters>) => void
  updateTruckPosition: (id: string, position: Position) => void
}

const useTruckStore = create<TruckState & TruckActions>((set, get) => ({
  trucks: [],
  selectedTruckId: null,
  filters: {},
  isLoading: false,
  error: null,
  
  loadTrucks: async () => {
    set({ isLoading: true, error: null })
    try {
      const trucks = await fetchTrucks()
      set({ trucks, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  selectTruck: (id: string) => set({ selectedTruckId: id }),
  
  setFilters: (filters: Partial<TruckFilters>) => 
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  
  updateTruckPosition: (id: string, position: Position) =>
    set((state) => ({
      trucks: state.trucks.map(truck =>
        truck.id === id ? { ...truck, currentPosition: position } : truck
      )
    }))
}))

// Usage with selective subscriptions
function TruckList() {
  const trucks = useTruckStore(state => state.trucks) // Only re-renders when trucks change
  const selectTruck = useTruckStore(state => state.selectTruck)
  
  return (
    <div>
      {trucks.map(truck => (
        <div key={truck.id} onClick={() => selectTruck(truck.id)}>
          {truck.plateNumber}
        </div>
      ))}
    </div>
  )
}

function TruckFilters() {
  const filters = useTruckStore(state => state.filters) // Only re-renders when filters change
  const setFilters = useTruckStore(state => state.setFilters)
  
  return (
    <div>
      <input 
        value={filters.company || ''} 
        onChange={(e) => setFilters({ company: e.target.value })}
      />
    </div>
  )
}
```

#### Context API
```typescript
interface TruckState {
  trucks: Truck[]
  selectedTruckId: string | null
  filters: TruckFilters
  isLoading: boolean
  error: string | null
}

interface TruckContextValue extends TruckState {
  loadTrucks: () => Promise<void>
  selectTruck: (id: string) => void
  setFilters: (filters: Partial<TruckFilters>) => void
  updateTruckPosition: (id: string, position: Position) => void
}

const TruckContext = createContext<TruckContextValue | null>(null)

// Multiple contexts for performance optimization
const TruckDataContext = createContext<{ trucks: Truck[] } | null>(null)
const TruckFiltersContext = createContext<{ 
  filters: TruckFilters
  setFilters: (filters: Partial<TruckFilters>) => void 
} | null>(null)

function TruckProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TruckState>({
    trucks: [],
    selectedTruckId: null,
    filters: {},
    isLoading: false,
    error: null
  })
  
  const loadTrucks = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const trucks = await fetchTrucks()
      setState(prev => ({ ...prev, trucks, isLoading: false }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }))
    }
  }, [])
  
  const selectTruck = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedTruckId: id }))
  }, [])
  
  const setFilters = useCallback((filters: Partial<TruckFilters>) => {
    setState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...filters } 
    }))
  }, [])
  
  const updateTruckPosition = useCallback((id: string, position: Position) => {
    setState(prev => ({
      ...prev,
      trucks: prev.trucks.map(truck =>
        truck.id === id ? { ...truck, currentPosition: position } : truck
      )
    }))
  }, [])
  
  const value = useMemo(() => ({
    ...state,
    loadTrucks,
    selectTruck,
    setFilters,
    updateTruckPosition
  }), [state, loadTrucks, selectTruck, setFilters, updateTruckPosition])
  
  return (
    <TruckContext.Provider value={value}>
      {children}
    </TruckContext.Provider>
  )
}

// Custom hooks with error handling
function useTrucks() {
  const context = useContext(TruckContext)
  if (!context) {
    throw new Error('useTrucks must be used within TruckProvider')
  }
  return context
}

// Usage - all components re-render on any state change
function TruckList() {
  const { trucks, selectTruck } = useTrucks() // Re-renders on ANY context change
  
  return (
    <div>
      {trucks.map(truck => (
        <div key={truck.id} onClick={() => selectTruck(truck.id)}>
          {truck.plateNumber}
        </div>
      ))}
    </div>
  )
}

function TruckFilters() {
  const { filters, setFilters } = useTrucks() // Re-renders on ANY context change
  
  return (
    <div>
      <input 
        value={filters.company || ''} 
        onChange={(e) => setFilters({ company: e.target.value })}
      />
    </div>
  )
}
```

## Performance Comparison

### Re-render Behavior

#### Zustand
```typescript
// Component only re-renders when selected data changes
function TruckCount() {
  const count = useTruckStore(state => state.trucks.length) // Only re-renders when truck count changes
  return <div>Total: {count}</div>
}

function SelectedTruck() {
  const selectedId = useTruckStore(state => state.selectedTruckId) // Only re-renders when selection changes
  return <div>Selected: {selectedId}</div>
}
```

#### Context API
```typescript
// All consumers re-render when any context value changes
function TruckCount() {
  const { trucks } = useTrucks() // Re-renders on ANY state change
  return <div>Total: {trucks.length}</div>
}

function SelectedTruck() {
  const { selectedTruckId } = useTrucks() // Re-renders on ANY state change
  return <div>Selected: {selectedTruckId}</div>
}

// Optimization required
const TruckCountOptimized = React.memo(() => {
  const { trucks } = useTrucks()
  return <div>Total: {trucks.length}</div>
})
```

### Performance Optimization Strategies

#### Context API Optimization
```typescript
// Split contexts to reduce re-renders
const TruckDataContext = createContext<{ trucks: Truck[] }>()
const TruckSelectionContext = createContext<{ 
  selectedTruckId: string | null
  selectTruck: (id: string) => void 
}>()

// Use React.memo and useMemo extensively
const TruckList = React.memo(() => {
  const { trucks } = useContext(TruckDataContext)
  const { selectTruck } = useContext(TruckSelectionContext)
  
  const memoizedTrucks = useMemo(() => 
    trucks.map(truck => ({ id: truck.id, name: truck.plateNumber })),
    [trucks]
  )
  
  return (
    <div>
      {memoizedTrucks.map(truck => (
        <TruckItem key={truck.id} truck={truck} onSelect={selectTruck} />
      ))}
    </div>
  )
})

// Use selectors with custom equality
function useTruckSelector<T>(selector: (state: TruckState) => T, equalityFn?: (a: T, b: T) => boolean) {
  const context = useTrucks()
  return useMemo(() => selector(context), [context, selector])
}
```

## Use Cases Comparison

### When to Use Zustand

#### ✅ Global Application State
```typescript
// Perfect for app-wide state
const useAppStore = create((set) => ({
  user: null,
  theme: 'light',
  notifications: [],
  
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  }))
}))
```

#### ✅ Complex State Logic
```typescript
// Handles complex updates easily
const useTruckStore = create((set, get) => ({
  trucks: [],
  
  updateTruckWithSideEffects: (id, updates) => {
    set((state) => ({
      trucks: state.trucks.map(truck =>
        truck.id === id ? { ...truck, ...updates } : truck
      )
    }))
    
    // Side effects
    const updatedTruck = get().trucks.find(t => t.id === id)
    if (updatedTruck?.status === 'stopped') {
      get().addAlert(id, 'Truck stopped unexpectedly')
    }
  }
}))
```

#### ✅ Cross-Component Communication
```typescript
// Easy communication between distant components
function HeaderNotifications() {
  const notifications = useAppStore(state => state.notifications)
  return <div>{notifications.length} notifications</div>
}

function SidebarActions() {
  const addNotification = useAppStore(state => state.addNotification)
  
  const handleAction = () => {
    addNotification({ message: 'Action completed', type: 'success' })
  }
  
  return <button onClick={handleAction}>Do Action</button>
}
```

### When to Use Context API

#### ✅ Tree-Scoped State
```typescript
// Perfect for component tree state
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Only affects components within the provider tree
function App() {
  return (
    <div>
      <ThemeProvider>
        <Dashboard /> {/* Has access to theme */}
      </ThemeProvider>
      <Footer /> {/* No access to theme */}
    </div>
  )
}
```

#### ✅ Dependency Injection
```typescript
// Great for injecting services/dependencies
const APIContext = createContext<APIService | null>(null)

function APIProvider({ children, apiService }) {
  return (
    <APIContext.Provider value={apiService}>
      {children}
    </APIContext.Provider>
  )
}

function DataComponent() {
  const api = useContext(APIContext)
  // Use injected API service
}
```

#### ✅ Feature-Specific State
```typescript
// Good for isolated feature state
function ShoppingCartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <CartContext.Provider value={{ items, isOpen, setItems, setIsOpen }}>
      {children}
    </CartContext.Provider>
  )
}

// Only cart-related components need this state
function ShoppingPage() {
  return (
    <ShoppingCartProvider>
      <ProductList />
      <Cart />
    </ShoppingCartProvider>
  )
}
```

## Migration Strategies

### From Context to Zustand

#### 1. Convert Context Provider to Store
```typescript
// Before (Context)
const UserContext = createContext()

function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [preferences, setPreferences] = useState({})
  
  return (
    <UserContext.Provider value={{ user, preferences, setUser, setPreferences }}>
      {children}
    </UserContext.Provider>
  )
}

// After (Zustand)
const useUserStore = create((set) => ({
  user: null,
  preferences: {},
  setUser: (user) => set({ user }),
  setPreferences: (preferences) => set({ preferences })
}))
```

#### 2. Remove Provider Wrappers
```typescript
// Before - nested providers
function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Dashboard />
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  )
}

// After - no providers needed
function App() {
  return <Dashboard />
}
```

### From Zustand to Context (when needed)

#### 1. Create Provider for Tree-Scoped State
```typescript
// When you need different state per route/feature
function FeatureProvider({ children, featureId }) {
  const [state, setState] = useState(() => 
    createFeatureState(featureId)
  )
  
  return (
    <FeatureContext.Provider value={state}>
      {children}
    </FeatureContext.Provider>
  )
}
```

## Best Practices

### Zustand Best Practices
1. **Use for global state**: App-wide data and actions
2. **Selective subscriptions**: Only subscribe to needed data
3. **Keep stores focused**: One store per domain
4. **Use TypeScript**: Full type safety

### Context API Best Practices
1. **Use for tree-scoped state**: Component subtree data
2. **Split contexts**: Avoid large context objects
3. **Optimize with memo**: Prevent unnecessary re-renders
4. **Provide error boundaries**: Handle context errors

## Real-World Example: Truck Tracker

### Hybrid Approach (Recommended)
```typescript
// Global state with Zustand
const useTruckStore = create((set) => ({
  trucks: [],
  loadTrucks: async () => {
    const trucks = await fetchTrucks()
    set({ trucks })
  }
}))

// Feature-specific state with Context
function MapProvider({ children }) {
  const [viewport, setViewport] = useState(defaultViewport)
  const [selectedLayers, setSelectedLayers] = useState(['trucks'])
  
  return (
    <MapContext.Provider value={{ viewport, selectedLayers, setViewport, setSelectedLayers }}>
      {children}
    </MapContext.Provider>
  )
}

// Usage
function App() {
  return (
    <div>
      <TruckList /> {/* Uses global truck store */}
      <MapProvider>
        <MapView /> {/* Uses both global trucks and local map state */}
      </MapProvider>
    </div>
  )
}
```

## Conclusion

**Choose Zustand when:**
- You need global application state
- Performance is important
- You want minimal boilerplate
- You need cross-component communication

**Choose Context API when:**
- You need tree-scoped state
- You're building reusable components
- You want to avoid external dependencies
- You need dependency injection patterns

**For the Truck Tracker project:**
- **Zustand** for global truck data, filters, and UI state
- **Context API** for map-specific state and theme preferences

Both tools complement each other well and can be used together in the same application.
