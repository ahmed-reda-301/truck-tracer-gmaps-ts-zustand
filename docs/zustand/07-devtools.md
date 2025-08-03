# Development Tools and Debugging

## Overview

Zustand provides excellent development tools integration, making it easy to debug and monitor your application state. This document covers DevTools setup, debugging techniques, and development best practices.

## Redux DevTools Integration

### Basic Setup

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterState>()(
  devtools(
    (set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
      reset: () => set({ count: 0 }, false, 'reset')
    }),
    {
      name: 'counter-store', // Store name in DevTools
    }
  )
)
```

### Advanced DevTools Configuration

```typescript
const useTruckStore = create<TruckStore>()(
  devtools(
    (set, get) => ({
      trucks: [],
      selectedTruckId: null,
      isLoading: false,
      error: null,
      
      loadTrucks: async () => {
        set({ isLoading: true, error: null }, false, 'loadTrucks/pending')
        try {
          const trucks = await fetchTrucks()
          set({ trucks, isLoading: false }, false, 'loadTrucks/fulfilled')
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false 
          }, false, 'loadTrucks/rejected')
        }
      },
      
      selectTruck: (id: string) => {
        set({ selectedTruckId: id }, false, `selectTruck/${id}`)
      },
      
      updateTruckPosition: (id: string, position: Position) => {
        set((state) => ({
          trucks: state.trucks.map(truck =>
            truck.id === id 
              ? { ...truck, currentPosition: position }
              : truck
          )
        }), false, `updateTruckPosition/${id}`)
      }
    }),
    {
      name: 'truck-store',
      serialize: {
        options: {
          // Serialize functions for better debugging
          function: (fn: Function) => fn.toString(),
          // Handle dates properly
          date: true,
          // Handle undefined values
          undefined: true
        }
      },
      // Enable action tracing
      trace: true,
      // Limit the number of actions stored
      maxAge: 100
    }
  )
)
```

## Action Naming Strategies

### Descriptive Action Names

```typescript
// ✅ Good - descriptive action names
const useTruckStore = create<TruckStore>()(
  devtools(
    (set, get) => ({
      // Loading actions
      loadTrucks: async () => {
        set({ isLoading: true }, false, 'trucks/loadStart')
        try {
          const trucks = await fetchTrucks()
          set({ trucks, isLoading: false }, false, 'trucks/loadSuccess')
        } catch (error) {
          set({ error: error.message, isLoading: false }, false, 'trucks/loadError')
        }
      },
      
      // CRUD actions
      addTruck: (truck: Truck) => {
        set((state) => ({
          trucks: [...state.trucks, truck]
        }), false, `trucks/add/${truck.plateNumber}`)
      },
      
      updateTruck: (id: string, updates: Partial<Truck>) => {
        set((state) => ({
          trucks: state.trucks.map(t => 
            t.id === id ? { ...t, ...updates } : t
          )
        }), false, `trucks/update/${id}`)
      },
      
      deleteTruck: (id: string) => {
        const truck = get().trucks.find(t => t.id === id)
        set((state) => ({
          trucks: state.trucks.filter(t => t.id !== id),
          selectedTruckId: state.selectedTruckId === id ? null : state.selectedTruckId
        }), false, `trucks/delete/${truck?.plateNumber || id}`)
      },
      
      // UI actions
      selectTruck: (id: string) => {
        const truck = get().trucks.find(t => t.id === id)
        set({ selectedTruckId: id }, false, `ui/selectTruck/${truck?.plateNumber || id}`)
      },
      
      // Filter actions
      setFilters: (filters: Partial<TruckFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }), false, `filters/update/${Object.keys(filters).join(',')}`)
      }
    }),
    { name: 'truck-store' }
  )
)
```

### Action Grouping

```typescript
// Group related actions with prefixes
const actionTypes = {
  // Data actions
  TRUCKS_LOAD_START: 'trucks/load/start',
  TRUCKS_LOAD_SUCCESS: 'trucks/load/success',
  TRUCKS_LOAD_ERROR: 'trucks/load/error',
  
  // CRUD actions
  TRUCK_ADD: 'truck/add',
  TRUCK_UPDATE: 'truck/update',
  TRUCK_DELETE: 'truck/delete',
  
  // UI actions
  UI_SELECT_TRUCK: 'ui/selectTruck',
  UI_TOGGLE_SIDEBAR: 'ui/toggleSidebar',
  UI_SET_THEME: 'ui/setTheme',
  
  // Filter actions
  FILTER_SET_ORIGIN: 'filter/setOrigin',
  FILTER_SET_STATUS: 'filter/setStatus',
  FILTER_CLEAR_ALL: 'filter/clearAll'
} as const

// Usage in store
const loadTrucks = async () => {
  set({ isLoading: true }, false, actionTypes.TRUCKS_LOAD_START)
  try {
    const trucks = await fetchTrucks()
    set({ trucks, isLoading: false }, false, actionTypes.TRUCKS_LOAD_SUCCESS)
  } catch (error) {
    set({ error: error.message, isLoading: false }, false, actionTypes.TRUCKS_LOAD_ERROR)
  }
}
```

## Custom DevTools Middleware

### Enhanced Logging Middleware

```typescript
import { StateCreator } from 'zustand'

interface DevToolsConfig {
  enabled: boolean
  name: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxActions: number
}

const createDevToolsMiddleware = <T>(config: DevToolsConfig) => 
  (f: StateCreator<T, [], [], T>): StateCreator<T, [], [], T> => 
  (set, get, store) => {
    if (!config.enabled) {
      return f(set, get, store)
    }
    
    const actionHistory: Array<{
      action: string
      timestamp: number
      prevState: T
      nextState: T
    }> = []
    
    const enhancedSet: typeof set = (...args) => {
      const prevState = get()
      const actionName = args[2] || 'unknown'
      const timestamp = Date.now()
      
      // Log action start
      if (config.logLevel === 'debug') {
        console.group(`🚀 ${actionName}`)
        console.log('Previous State:', prevState)
        console.log('Timestamp:', new Date(timestamp).toISOString())
      }
      
      // Execute the state update
      set(...args)
      
      const nextState = get()
      
      // Log action end
      if (config.logLevel === 'debug') {
        console.log('Next State:', nextState)
        console.log('State Diff:', getStateDiff(prevState, nextState))
        console.groupEnd()
      }
      
      // Store in history
      actionHistory.push({
        action: actionName,
        timestamp,
        prevState,
        nextState
      })
      
      // Limit history size
      if (actionHistory.length > config.maxActions) {
        actionHistory.shift()
      }
      
      // Expose history on window for debugging
      if (typeof window !== 'undefined') {
        (window as any)[`${config.name}History`] = actionHistory
      }
    }
    
    return f(enhancedSet, get, store)
  }

// Helper function to calculate state diff
function getStateDiff<T>(prev: T, next: T): Partial<T> {
  const diff: Partial<T> = {}
  
  for (const key in next) {
    if (prev[key] !== next[key]) {
      diff[key] = next[key]
    }
  }
  
  return diff
}

// Usage
const useTruckStore = create<TruckStore>()(
  createDevToolsMiddleware({
    enabled: process.env.NODE_ENV === 'development',
    name: 'truck-store',
    logLevel: 'debug',
    maxActions: 50
  })(
    (set, get) => ({
      // Store implementation
    })
  )
)
```

## Performance Monitoring

### Performance Tracking Middleware

```typescript
const performanceMiddleware = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  const performanceSet: typeof set = (...args) => {
    const actionName = args[2] || 'unknown'
    const startTime = performance.now()
    
    // Execute state update
    set(...args)
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Log slow operations
    if (duration > 5) {
      console.warn(`⚠️ Slow state update detected:`, {
        action: actionName,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
    }
    
    // Send to analytics (in production)
    if (process.env.NODE_ENV === 'production' && duration > 10) {
      // Send to monitoring service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'slow_state_update', {
          action_name: actionName,
          duration: Math.round(duration),
          custom_parameter: 'zustand_performance'
        })
      }
    }
  }
  
  return f(performanceSet, get, store)
}
```

### Memory Usage Tracking

```typescript
const memoryTrackingMiddleware = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  let updateCount = 0
  
  const memorySet: typeof set = (...args) => {
    updateCount++
    
    // Track memory usage every 100 updates
    if (updateCount % 100 === 0 && typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory
      console.log(`📊 Memory Usage (after ${updateCount} updates):`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      })
    }
    
    set(...args)
  }
  
  return f(memorySet, get, store)
}
```

## Debugging Techniques

### State Inspection Utilities

```typescript
// Add debugging utilities to your store
const useTruckStore = create<TruckStore>()(
  devtools(
    (set, get) => ({
      // ... regular store implementation
      
      // Debugging utilities (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        // Get current state snapshot
        _getSnapshot: () => {
          const state = get()
          console.log('📸 Current State Snapshot:', state)
          return state
        },
        
        // Reset store to initial state
        _reset: () => {
          set({
            trucks: [],
            selectedTruckId: null,
            isLoading: false,
            error: null,
            filters: {}
          } as Partial<TruckStore>, false, '_reset')
        },
        
        // Load test data
        _loadTestData: () => {
          const testTrucks = [
            { id: '1', plateNumber: 'TEST-001', status: 'moving' },
            { id: '2', plateNumber: 'TEST-002', status: 'stopped' }
          ]
          set({ trucks: testTrucks }, false, '_loadTestData')
        },
        
        // Simulate error state
        _simulateError: (message: string = 'Test error') => {
          set({ error: message, isLoading: false }, false, '_simulateError')
        }
      })
    }),
    { name: 'truck-store' }
  )
)

// Expose store globally for debugging (development only)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).truckStore = useTruckStore
}
```

### Console Debugging Commands

```typescript
// Add these to your browser console for debugging

// Get current state
window.truckStore.getState()

// Get state snapshot with logging
window.truckStore.getState()._getSnapshot()

// Reset store
window.truckStore.getState()._reset()

// Load test data
window.truckStore.getState()._loadTestData()

// Simulate error
window.truckStore.getState()._simulateError('Custom error message')

// Subscribe to state changes
const unsubscribe = window.truckStore.subscribe(
  (state) => console.log('State changed:', state)
)

// Unsubscribe
unsubscribe()
```

## Testing Integration

### DevTools in Tests

```typescript
// Mock DevTools for testing
const createTestStore = <T>(storeCreator: StateCreator<T, [], [], T>) => {
  // In tests, skip DevTools middleware
  if (process.env.NODE_ENV === 'test') {
    return create<T>(storeCreator)
  }
  
  // In development, use DevTools
  return create<T>()(
    devtools(storeCreator, { name: 'test-store' })
  )
}

// Test store creation
describe('TruckStore with DevTools', () => {
  it('should work without DevTools in test environment', () => {
    const store = createTestStore<TruckStore>((set) => ({
      trucks: [],
      loadTrucks: async () => {
        set({ trucks: mockTrucks })
      }
    }))
    
    expect(store.getState().trucks).toEqual([])
  })
})
```

## Production Considerations

### Conditional DevTools

```typescript
// Only enable DevTools in development
const createProductionStore = <T>(
  storeCreator: StateCreator<T, [], [], T>,
  storeName: string
) => {
  if (process.env.NODE_ENV === 'development') {
    return create<T>()(
      devtools(storeCreator, { name: storeName })
    )
  }
  
  return create<T>(storeCreator)
}

// Usage
const useTruckStore = createProductionStore<TruckStore>(
  (set, get) => ({
    // Store implementation
  }),
  'truck-store'
)
```

### Environment-Specific Configuration

```typescript
const devToolsConfig = {
  development: {
    enabled: true,
    trace: true,
    serialize: true,
    maxAge: 100
  },
  production: {
    enabled: false,
    trace: false,
    serialize: false,
    maxAge: 0
  },
  test: {
    enabled: false,
    trace: false,
    serialize: false,
    maxAge: 0
  }
}

const currentConfig = devToolsConfig[process.env.NODE_ENV as keyof typeof devToolsConfig]

const useTruckStore = create<TruckStore>()(
  currentConfig.enabled
    ? devtools(
        storeImplementation,
        {
          name: 'truck-store',
          trace: currentConfig.trace,
          serialize: currentConfig.serialize,
          maxAge: currentConfig.maxAge
        }
      )
    : storeImplementation
)
```

## Best Practices

### 1. Use Meaningful Action Names
```typescript
// ✅ Good
set({ isLoading: true }, false, 'trucks/load/start')
set({ trucks }, false, 'trucks/load/success')

// ❌ Bad
set({ isLoading: true })
set({ trucks })
```

### 2. Group Related Actions
```typescript
// ✅ Good - grouped actions
'trucks/load/start'
'trucks/load/success'
'trucks/load/error'

// ❌ Bad - inconsistent naming
'loadTrucks'
'trucksLoaded'
'errorLoadingTrucks'
```

### 3. Include Context in Action Names
```typescript
// ✅ Good - includes context
set({ selectedTruckId: id }, false, `ui/selectTruck/${truckPlateNumber}`)

// ❌ Bad - no context
set({ selectedTruckId: id }, false, 'selectTruck')
```

### 4. Disable DevTools in Production
```typescript
// ✅ Good - conditional DevTools
const store = process.env.NODE_ENV === 'development'
  ? create()(devtools(storeCreator, { name: 'store' }))
  : create(storeCreator)
```

### 5. Use DevTools for Performance Monitoring
```typescript
// ✅ Good - track performance
const slowAction = () => {
  const start = performance.now()
  // ... complex operation
  const duration = performance.now() - start
  set(newState, false, `slowAction (${duration.toFixed(2)}ms)`)
}
```

DevTools integration makes Zustand development much more productive by providing visibility into state changes, action history, and performance characteristics. Use these tools to build better applications with confidence.
