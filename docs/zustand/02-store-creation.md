# Store Creation Patterns

## Overview

This document covers advanced patterns for creating Zustand stores, including different architectural approaches, store composition, and best practices for organizing complex state.

## Basic Store Creation

### Simple Store
The most basic way to create a Zustand store:

```typescript
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}))
```

### Store with Get Function
Access current state within actions using the `get` function:

```typescript
const useAdvancedStore = create<State>((set, get) => ({
  items: [],
  selectedId: null,
  
  addItem: (item: Item) => {
    const currentItems = get().items
    set({ items: [...currentItems, item] })
  },
  
  selectItem: (id: string) => {
    const item = get().items.find(item => item.id === id)
    if (item) {
      set({ selectedId: id })
    }
  },
  
  getSelectedItem: () => {
    const { items, selectedId } = get()
    return items.find(item => item.id === selectedId) || null
  }
}))
```

## Advanced Store Patterns

### 1. Modular Store Architecture

Split large stores into smaller, focused modules:

```typescript
// types/store.ts
interface TruckState {
  trucks: Truck[]
  selectedTruckId: string | null
}

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
}

interface FilterState {
  filters: TruckFilters
  activeFilters: string[]
}

// stores/truckSlice.ts
export const createTruckSlice = (set: SetState, get: GetState) => ({
  trucks: [],
  selectedTruckId: null,
  
  loadTrucks: async () => {
    const trucks = await fetchTrucks()
    set({ trucks })
  },
  
  selectTruck: (id: string) => {
    set({ selectedTruckId: id })
  }
})

// stores/uiSlice.ts
export const createUISlice = (set: SetState, get: GetState) => ({
  sidebarOpen: true,
  theme: 'light' as const,
  
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },
  
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme })
  }
})

// stores/index.ts
export const useAppStore = create<TruckState & UIState & FilterState>()(
  (...args) => ({
    ...createTruckSlice(...args),
    ...createUISlice(...args),
    ...createFilterSlice(...args)
  })
)
```

### 2. Factory Pattern for Store Creation

Create reusable store factories:

```typescript
interface ListState<T> {
  items: T[]
  selectedId: string | null
  isLoading: boolean
  error: string | null
}

interface ListActions<T> {
  loadItems: () => Promise<void>
  addItem: (item: T) => void
  removeItem: (id: string) => void
  selectItem: (id: string) => void
  clearSelection: () => void
}

function createListStore<T extends { id: string }>(
  fetchFn: () => Promise<T[]>
) {
  return create<ListState<T> & ListActions<T>>((set, get) => ({
    items: [],
    selectedId: null,
    isLoading: false,
    error: null,
    
    loadItems: async () => {
      set({ isLoading: true, error: null })
      try {
        const items = await fetchFn()
        set({ items, isLoading: false })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load',
          isLoading: false 
        })
      }
    },
    
    addItem: (item: T) => {
      set((state) => ({ items: [...state.items, item] }))
    },
    
    removeItem: (id: string) => {
      set((state) => ({
        items: state.items.filter(item => item.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId
      }))
    },
    
    selectItem: (id: string) => {
      const item = get().items.find(item => item.id === id)
      if (item) {
        set({ selectedId: id })
      }
    },
    
    clearSelection: () => {
      set({ selectedId: null })
    }
  }))
}

// Usage
const useTruckStore = createListStore<Truck>(() => fetchTrucks())
const useRouteStore = createListStore<Route>(() => fetchRoutes())
```

### 3. Store Composition with Multiple Stores

Combine multiple stores for complex applications:

```typescript
// Individual stores
const useTruckStore = create<TruckState & TruckActions>(/* ... */)
const useUIStore = create<UIState & UIActions>(/* ... */)
const useFilterStore = create<FilterState & FilterActions>(/* ... */)

// Composed hook for convenience
export const useAppData = () => {
  const trucks = useTruckStore(state => state.trucks)
  const selectedTruck = useTruckStore(state => state.selectedTruck)
  const filters = useFilterStore(state => state.filters)
  const ui = useUIStore(state => state.ui)
  
  return {
    trucks,
    selectedTruck,
    filters,
    ui
  }
}

// Cross-store actions
export const useAppActions = () => {
  const selectTruck = useTruckStore(state => state.selectTruck)
  const setFilters = useFilterStore(state => state.setFilters)
  const toggleSidebar = useUIStore(state => state.toggleSidebar)
  
  const selectTruckAndShowDetails = (truckId: string) => {
    selectTruck(truckId)
    toggleSidebar() // Open sidebar to show details
  }
  
  return {
    selectTruck,
    setFilters,
    toggleSidebar,
    selectTruckAndShowDetails
  }
}
```

## Store Organization Patterns

### 1. Feature-Based Organization

```
stores/
├── index.ts              # Main store exports
├── types.ts              # Store type definitions
├── trucks/
│   ├── truckStore.ts     # Truck-related state
│   ├── truckActions.ts   # Truck actions
│   └── truckSelectors.ts # Truck selectors
├── ui/
│   ├── uiStore.ts        # UI state
│   └── uiActions.ts      # UI actions
└── filters/
    ├── filterStore.ts    # Filter state
    └── filterActions.ts  # Filter actions
```

### 2. Layer-Based Organization

```
stores/
├── index.ts              # Main exports
├── state/                # State definitions
│   ├── truckState.ts
│   ├── uiState.ts
│   └── filterState.ts
├── actions/              # Action definitions
│   ├── truckActions.ts
│   ├── uiActions.ts
│   └── filterActions.ts
├── selectors/            # Selector functions
│   ├── truckSelectors.ts
│   ├── uiSelectors.ts
│   └── filterSelectors.ts
└── utils/                # Store utilities
    ├── storeFactory.ts
    └── middleware.ts
```

## Store Configuration Options

### DevTools Integration

```typescript
import { devtools } from 'zustand/middleware'

const useStore = create<State>()(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'truck-store', // DevTools name
      serialize: true,      // Enable serialization
      trace: true          // Enable action tracing
    }
  )
)
```

### Persistence

```typescript
import { persist } from 'zustand/middleware'

const useStore = create<State>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'truck-storage',
      partialize: (state) => ({
        // Only persist specific parts
        preferences: state.preferences,
        theme: state.theme
      })
    }
  )
)
```

### Subscriptions and Listeners

```typescript
const useStore = create<State>((set, get) => ({
  count: 0,
  increment: () => {
    set((state) => ({ count: state.count + 1 }))
    
    // Side effects
    const newCount = get().count
    if (newCount > 10) {
      console.log('Count exceeded 10!')
    }
  }
}))

// External subscriptions
useStore.subscribe(
  (state) => state.count,
  (count) => {
    console.log('Count changed to:', count)
  }
)
```

## Best Practices

### 1. Keep Stores Focused
- Each store should have a single responsibility
- Avoid mixing unrelated state in one store
- Use composition for complex applications

### 2. Use TypeScript Effectively
```typescript
// Define clear interfaces
interface TruckStore {
  // State
  trucks: Truck[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadTrucks: () => Promise<void>
  addTruck: (truck: Truck) => void
  updateTruck: (id: string, updates: Partial<Truck>) => void
}

// Use generic constraints
interface EntityStore<T extends { id: string }> {
  items: T[]
  selectedId: string | null
  selectItem: (id: string) => void
}
```

### 3. Organize Actions Logically
```typescript
const useStore = create<State>((set, get) => ({
  // State
  trucks: [],
  filters: {},
  ui: {},
  
  // Data actions
  loadTrucks: async () => { /* ... */ },
  addTruck: (truck) => { /* ... */ },
  updateTruck: (id, updates) => { /* ... */ },
  
  // Filter actions
  setFilters: (filters) => { /* ... */ },
  clearFilters: () => { /* ... */ },
  
  // UI actions
  toggleSidebar: () => { /* ... */ },
  setTheme: (theme) => { /* ... */ }
}))
```

### 4. Handle Async Operations Properly
```typescript
const useStore = create<State>((set, get) => ({
  isLoading: false,
  error: null,
  
  fetchData: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const data = await api.fetchData()
      set({ data, isLoading: false })
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      })
    }
  }
}))
```

## Common Patterns in Our Truck Tracker

Our truck tracking application uses several of these patterns:

1. **Modular Architecture**: Separate concerns for trucks, UI, and filters
2. **DevTools Integration**: For debugging and development
3. **Async Actions**: For loading truck data
4. **Selective Persistence**: Save user preferences
5. **Custom Selectors**: For filtered and computed data

## Next Steps

- Learn about **State Update Strategies** for complex mutations
- Explore **Selectors and Performance** optimization
- Understand **Middleware** for advanced functionality
