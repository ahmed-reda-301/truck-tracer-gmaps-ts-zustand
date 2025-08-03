# Middleware and Enhancers

## Overview

Zustand middleware allows you to enhance your stores with additional functionality like persistence, devtools integration, logging, and custom behaviors. This document covers built-in middleware and how to create custom middleware.

## Built-in Middleware

### 1. DevTools Middleware

The devtools middleware integrates with Redux DevTools for debugging:

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

const useCounterStore = create<CounterState>()(
  devtools(
    (set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement')
    }),
    {
      name: 'counter-store', // Store name in devtools
      serialize: true,        // Enable serialization
      trace: true            // Enable action tracing
    }
  )
)
```

### 2. Persist Middleware

The persist middleware saves and restores store state:

```typescript
import { persist } from 'zustand/middleware'

interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: string) => void
  toggleNotifications: () => void
}

const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      notifications: true,
      
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () => set((state) => ({ 
        notifications: !state.notifications 
      }))
    }),
    {
      name: 'user-preferences', // Storage key
      
      // Partial persistence - only save specific fields
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notifications: state.notifications
      }),
      
      // Custom storage (default is localStorage)
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name)
          return value ? JSON.parse(value) : null
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      },
      
      // Version for migration
      version: 1,
      
      // Migration function
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate from version 0 to 1
          return {
            ...persistedState,
            notifications: true // Add new field
          }
        }
        return persistedState
      }
    }
  )
)
```

### 3. Subscriptions with Subscribe

Listen to store changes outside of React components:

```typescript
const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))

// Subscribe to entire store
const unsubscribe = useStore.subscribe(
  (state) => {
    console.log('Store changed:', state)
  }
)

// Subscribe to specific values
const unsubscribeCount = useStore.subscribe(
  (state) => state.count,
  (count, previousCount) => {
    console.log('Count changed from', previousCount, 'to', count)
  }
)

// Cleanup
unsubscribe()
unsubscribeCount()
```

## Combining Middleware

You can combine multiple middleware:

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  setUser: (user: User) => void
  setTheme: (theme: 'light' | 'dark') => void
}

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        theme: 'light',
        
        setUser: (user) => set({ user }, false, 'setUser'),
        setTheme: (theme) => set({ theme }, false, 'setTheme')
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ theme: state.theme }) // Only persist theme
      }
    ),
    {
      name: 'app-store'
    }
  )
)
```

## Custom Middleware

### Creating Custom Middleware

```typescript
import { StateCreator } from 'zustand'

// Logger middleware
const logger = <T>(
  f: StateCreator<T, [], [], T>,
  name?: string
): StateCreator<T, [], [], T> => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    console.log(`[${name || 'Store'}] Previous state:`, get())
    set(...args)
    console.log(`[${name || 'Store'}] New state:`, get())
  }
  
  return f(loggedSet, get, store)
}

// Usage
const useStore = create<State>()(
  logger(
    (set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }))
    }),
    'counter'
  )
)
```

### Advanced Custom Middleware

```typescript
// Undo/Redo middleware
interface UndoRedoState<T> {
  past: T[]
  present: T
  future: T[]
}

const undoRedo = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<UndoRedoState<T> & { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }, [], [], UndoRedoState<T> & { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }> => 
(set, get, store) => {
  const initialState = f(
    (partial, replace) => {
      const current = get()
      const newPresent = typeof partial === 'function' 
        ? (partial as (state: T) => T)(current.present)
        : { ...current.present, ...partial }
      
      set({
        past: [...current.past, current.present],
        present: newPresent,
        future: []
      })
    },
    () => get().present,
    store
  )
  
  return {
    past: [],
    present: initialState,
    future: [],
    
    undo: () => {
      const { past, present, future } = get()
      if (past.length === 0) return
      
      const previous = past[past.length - 1]
      const newPast = past.slice(0, past.length - 1)
      
      set({
        past: newPast,
        present: previous,
        future: [present, ...future]
      })
    },
    
    redo: () => {
      const { past, present, future } = get()
      if (future.length === 0) return
      
      const next = future[0]
      const newFuture = future.slice(1)
      
      set({
        past: [...past, present],
        present: next,
        future: newFuture
      })
    },
    
    canUndo: get().past.length > 0,
    canRedo: get().future.length > 0
  }
}
```

### Real-Time Sync Middleware

```typescript
// WebSocket sync middleware
const websocketSync = <T>(
  f: StateCreator<T, [], [], T>,
  websocketUrl: string
): StateCreator<T, [], [], T> => (set, get, store) => {
  const ws = new WebSocket(websocketUrl)
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'STATE_UPDATE') {
      set(data.payload, true) // Replace state
    }
  }
  
  const syncedSet: typeof set = (...args) => {
    set(...args)
    
    // Send update to server
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'STATE_UPDATE',
        payload: get()
      }))
    }
  }
  
  return f(syncedSet, get, store)
}

// Usage for truck tracking
const useTruckStore = create<TruckState>()(
  websocketSync(
    (set, get) => ({
      trucks: [],
      updateTruckPosition: (id, position) => set((state) => ({
        trucks: state.trucks.map(truck =>
          truck.id === id ? { ...truck, currentPosition: position } : truck
        )
      }))
    }),
    'ws://localhost:8080/trucks'
  )
)
```

## Middleware for Truck Tracker

### Truck Store with Multiple Middleware

```typescript
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

interface TruckStore {
  trucks: Truck[]
  selectedTruckId: string | null
  filters: TruckFilters
  ui: UIState
  
  // Actions
  loadTrucks: () => Promise<void>
  selectTruck: (id: string) => void
  updateTruckPosition: (id: string, position: Position) => void
  setFilters: (filters: Partial<TruckFilters>) => void
  setTheme: (theme: 'light' | 'dark') => void
}

const useTruckStore = create<TruckStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        (set, get) => ({
          trucks: [],
          selectedTruckId: null,
          filters: {},
          ui: {
            theme: 'light',
            sidebarOpen: true,
            mapViewport: { center: { lat: 24.7136, lng: 46.6753 }, zoom: 6 }
          },
          
          loadTrucks: async () => {
            const trucks = await fetchTrucks()
            set({ trucks }, false, 'loadTrucks')
          },
          
          selectTruck: (id: string) => {
            set({ selectedTruckId: id }, false, 'selectTruck')
          },
          
          updateTruckPosition: (id: string, position: Position) => {
            set((state) => ({
              trucks: state.trucks.map(truck =>
                truck.id === id 
                  ? { ...truck, currentPosition: position, lastUpdate: new Date().toISOString() }
                  : truck
              )
            }), false, 'updateTruckPosition')
          },
          
          setFilters: (filters: Partial<TruckFilters>) => {
            set((state) => ({
              filters: { ...state.filters, ...filters }
            }), false, 'setFilters')
          },
          
          setTheme: (theme: 'light' | 'dark') => {
            set((state) => ({
              ui: { ...state.ui, theme }
            }), false, 'setTheme')
          }
        })
      ),
      {
        name: 'truck-store',
        partialize: (state) => ({
          ui: {
            theme: state.ui.theme,
            sidebarOpen: state.ui.sidebarOpen
          },
          filters: state.filters
        })
      }
    ),
    {
      name: 'truck-store'
    }
  )
)

// Subscribe to truck position changes
useTruckStore.subscribe(
  (state) => state.trucks,
  (trucks, previousTrucks) => {
    // Check for position changes
    trucks.forEach(truck => {
      const previousTruck = previousTrucks.find(p => p.id === truck.id)
      if (previousTruck && 
          (previousTruck.currentPosition.lat !== truck.currentPosition.lat ||
           previousTruck.currentPosition.lng !== truck.currentPosition.lng)) {
        console.log(`Truck ${truck.plateNumber} moved to`, truck.currentPosition)
      }
    })
  }
)
```

### Custom Alert Middleware

```typescript
// Alert middleware for truck tracking
const alertMiddleware = <T extends { trucks: Truck[] }>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  const alertSet: typeof set = (...args) => {
    const previousState = get()
    set(...args)
    const newState = get()
    
    // Check for new alerts
    if ('trucks' in newState && 'trucks' in previousState) {
      newState.trucks.forEach(truck => {
        const previousTruck = previousState.trucks.find(p => p.id === truck.id)
        
        // Speed alert
        if (truck.speed > 120 && (!previousTruck || previousTruck.speed <= 120)) {
          console.warn(`ALERT: Truck ${truck.plateNumber} exceeding speed limit: ${truck.speed} km/h`)
          // Could dispatch notification, send to server, etc.
        }
        
        // Stop alert
        if (truck.status === 'stopped' && previousTruck?.status === 'moving') {
          console.warn(`ALERT: Truck ${truck.plateNumber} has stopped unexpectedly`)
        }
        
        // Low fuel alert
        if (truck.fuel < 20 && (!previousTruck || previousTruck.fuel >= 20)) {
          console.warn(`ALERT: Truck ${truck.plateNumber} has low fuel: ${truck.fuel}%`)
        }
      })
    }
  }
  
  return f(alertSet, get, store)
}

// Usage
const useTruckStore = create<TruckStore>()(
  alertMiddleware(
    (set, get) => ({
      trucks: [],
      updateTruckPosition: (id, position) => set((state) => ({
        trucks: state.trucks.map(truck =>
          truck.id === id ? { ...truck, currentPosition: position } : truck
        )
      }))
    })
  )
)
```

### Performance Monitoring Middleware

```typescript
// Performance monitoring middleware
const performanceMiddleware = <T>(
  f: StateCreator<T, [], [], T>,
  storeName: string = 'store'
): StateCreator<T, [], [], T> => (set, get, store) => {
  const performanceSet: typeof set = (...args) => {
    const startTime = performance.now()
    set(...args)
    const endTime = performance.now()
    
    const actionName = args[2] || 'unknown'
    const duration = endTime - startTime
    
    if (duration > 10) { // Log slow updates
      console.warn(`[${storeName}] Slow update detected: ${actionName} took ${duration.toFixed(2)}ms`)
    }
    
    // Could send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'store_update', {
        store_name: storeName,
        action_name: actionName,
        duration: Math.round(duration)
      })
    }
  }
  
  return f(performanceSet, get, store)
}
```

## Middleware Best Practices

### 1. Order Matters
```typescript
// Correct order: devtools should be outermost for proper action names
const useStore = create<State>()(
  devtools(           // 1. DevTools (outermost)
    persist(          // 2. Persistence
      logger(         // 3. Logging
        (set, get) => ({
          // Store implementation
        })
      )
    )
  )
)
```

### 2. Type Safety
```typescript
// Ensure middleware preserves types
const typedMiddleware = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  // Middleware logic
  return f(set, get, store)
}
```

### 3. Error Handling
```typescript
const errorHandlingMiddleware = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  const safeSet: typeof set = (...args) => {
    try {
      set(...args)
    } catch (error) {
      console.error('Store update failed:', error)
      // Could send to error reporting service
    }
  }
  
  return f(safeSet, get, store)
}
```

### 4. Cleanup
```typescript
// Middleware with cleanup
const subscriptionMiddleware = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  const subscriptions: (() => void)[] = []
  
  // Add cleanup to store
  const originalDestroy = store.destroy
  store.destroy = () => {
    subscriptions.forEach(unsubscribe => unsubscribe())
    originalDestroy?.()
  }
  
  return f(set, get, store)
}
```

## Testing Middleware

```typescript
import { create } from 'zustand'

describe('Logger Middleware', () => {
  let consoleSpy: jest.SpyInstance
  
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  })
  
  afterEach(() => {
    consoleSpy.mockRestore()
  })
  
  it('should log state changes', () => {
    const useStore = create(
      logger(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }))
        }),
        'test-store'
      )
    )
    
    const { increment } = useStore.getState()
    increment()
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[test-store] Previous state:',
      { count: 0, increment: expect.any(Function) }
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      '[test-store] New state:',
      { count: 1, increment: expect.any(Function) }
    )
  })
})
```

## Next Steps

- Learn about **TypeScript Integration** for better type safety
- Explore **DevTools** for debugging and development
- Understand **Testing** strategies for middleware and stores
- Study **Best Practices** for production applications
