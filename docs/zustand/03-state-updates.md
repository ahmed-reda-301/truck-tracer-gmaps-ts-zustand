# State Update Strategies

## Overview

This document covers various patterns and strategies for updating state in Zustand, including immutable updates, complex state mutations, and performance considerations.

## Basic State Updates

### Simple Updates
The most straightforward way to update state:

```typescript
const useStore = create<State>((set) => ({
  count: 0,
  name: '',
  
  // Direct property update
  setCount: (count: number) => set({ count }),
  
  // Multiple properties
  setUserInfo: (name: string, count: number) => set({ name, count }),
  
  // Partial updates
  updatePartial: (updates: Partial<State>) => set(updates)
}))
```

### Functional Updates
Use the previous state to calculate new state:

```typescript
const useStore = create<State>((set) => ({
  count: 0,
  items: [],
  
  // Increment based on current value
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  // Add item to array
  addItem: (item: Item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  // Complex calculation
  calculateTotal: () => set((state) => ({
    total: state.items.reduce((sum, item) => sum + item.price, 0)
  }))
}))
```

## Immutable Update Patterns

### Array Operations

```typescript
interface ListState {
  items: Item[]
  addItem: (item: Item) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  moveItem: (fromIndex: number, toIndex: number) => void
  clearItems: () => void
}

const useListStore = create<ListState>((set) => ({
  items: [],
  
  // ✅ Add item (immutable)
  addItem: (item: Item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  // ✅ Remove item (immutable)
  removeItem: (id: string) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  
  // ✅ Update item (immutable)
  updateItem: (id: string, updates: Partial<Item>) => set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  // ✅ Move item (immutable)
  moveItem: (fromIndex: number, toIndex: number) => set((state) => {
    const newItems = [...state.items]
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)
    return { items: newItems }
  }),
  
  // ✅ Clear all items
  clearItems: () => set({ items: [] })
}))
```

### Object Updates

```typescript
interface UserState {
  user: {
    id: string
    profile: {
      name: string
      email: string
      preferences: {
        theme: string
        notifications: boolean
      }
    }
    settings: Record<string, any>
  }
}

const useUserStore = create<UserState>((set) => ({
  user: {
    id: '',
    profile: {
      name: '',
      email: '',
      preferences: {
        theme: 'light',
        notifications: true
      }
    },
    settings: {}
  },
  
  // ✅ Update nested object (immutable)
  updateProfile: (updates: Partial<UserState['user']['profile']>) => 
    set((state) => ({
      user: {
        ...state.user,
        profile: {
          ...state.user.profile,
          ...updates
        }
      }
    })),
  
  // ✅ Update deeply nested property
  updatePreference: (key: string, value: any) => 
    set((state) => ({
      user: {
        ...state.user,
        profile: {
          ...state.user.profile,
          preferences: {
            ...state.user.profile.preferences,
            [key]: value
          }
        }
      }
    })),
  
  // ✅ Update settings object
  setSetting: (key: string, value: any) => 
    set((state) => ({
      user: {
        ...state.user,
        settings: {
          ...state.user.settings,
          [key]: value
        }
      }
    }))
}))
```

## Advanced Update Patterns

### Batch Updates
Perform multiple updates in a single action:

```typescript
const useStore = create<State>((set, get) => ({
  trucks: [],
  selectedTruckId: null,
  filters: {},
  
  // Batch multiple related updates
  selectTruckAndApplyFilters: (truckId: string, filters: Filters) => {
    set((state) => ({
      selectedTruckId: truckId,
      filters: { ...state.filters, ...filters },
      // Update any derived state
      lastAction: 'select_and_filter',
      timestamp: Date.now()
    }))
  },
  
  // Reset multiple parts of state
  resetToDefaults: () => {
    set({
      selectedTruckId: null,
      filters: {},
      searchQuery: '',
      sortBy: 'name',
      sortOrder: 'asc'
    })
  }
}))
```

### Conditional Updates
Update state based on conditions:

```typescript
const useStore = create<State>((set, get) => ({
  trucks: [],
  alerts: [],
  
  updateTruckStatus: (truckId: string, status: TruckStatus) => {
    set((state) => {
      const truck = state.trucks.find(t => t.id === truckId)
      if (!truck) return state // No update if truck not found
      
      const updatedTrucks = state.trucks.map(t =>
        t.id === truckId ? { ...t, status } : t
      )
      
      // Conditionally add alert for stopped trucks
      const newAlerts = status === 'stopped' 
        ? [...state.alerts, {
            id: `alert-${truckId}-${Date.now()}`,
            truckId,
            type: 'stop',
            message: 'Truck has stopped',
            timestamp: new Date().toISOString()
          }]
        : state.alerts
      
      return {
        trucks: updatedTrucks,
        alerts: newAlerts
      }
    })
  }
}))
```

### Optimistic Updates
Update UI immediately, then sync with server:

```typescript
const useStore = create<State>((set, get) => ({
  trucks: [],
  pendingUpdates: new Set<string>(),
  
  updateTruckOptimistic: async (truckId: string, updates: Partial<Truck>) => {
    // 1. Optimistic update
    set((state) => ({
      trucks: state.trucks.map(truck =>
        truck.id === truckId ? { ...truck, ...updates } : truck
      ),
      pendingUpdates: new Set([...state.pendingUpdates, truckId])
    }))
    
    try {
      // 2. Send to server
      const updatedTruck = await api.updateTruck(truckId, updates)
      
      // 3. Confirm update
      set((state) => ({
        trucks: state.trucks.map(truck =>
          truck.id === truckId ? updatedTruck : truck
        ),
        pendingUpdates: new Set(
          [...state.pendingUpdates].filter(id => id !== truckId)
        )
      }))
    } catch (error) {
      // 4. Revert on error
      const originalTruck = get().trucks.find(t => t.id === truckId)
      if (originalTruck) {
        set((state) => ({
          trucks: state.trucks.map(truck =>
            truck.id === truckId ? originalTruck : truck
          ),
          pendingUpdates: new Set(
            [...state.pendingUpdates].filter(id => id !== truckId)
          ),
          error: 'Failed to update truck'
        }))
      }
    }
  }
}))
```

## Performance Optimization

### Minimize Re-renders
Structure updates to minimize component re-renders:

```typescript
// ❌ This will cause all subscribers to re-render
const badUpdate = () => set((state) => ({
  ...state, // Spreads entire state
  count: state.count + 1
}))

// ✅ This only updates the specific property
const goodUpdate = () => set((state) => ({
  count: state.count + 1
}))

// ✅ Even better - use direct update for simple cases
const bestUpdate = () => set({ count: get().count + 1 })
```

### Selective Updates
Update only what's necessary:

```typescript
const useStore = create<State>((set, get) => ({
  trucks: [],
  ui: { theme: 'light', sidebarOpen: true },
  
  // ❌ Updates entire UI object
  badToggleSidebar: () => set((state) => ({
    ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
  })),
  
  // ✅ Updates only the specific UI property
  goodToggleSidebar: () => set((state) => ({
    ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
  }))
}))
```

### Debounced Updates
Debounce frequent updates:

```typescript
import { debounce } from 'lodash'

const useStore = create<State>((set, get) => ({
  searchQuery: '',
  searchResults: [],
  
  // Immediate UI update
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
    debouncedSearch(query)
  }
}))

// Debounced search function
const debouncedSearch = debounce(async (query: string) => {
  if (query.length > 2) {
    const results = await searchTrucks(query)
    useStore.getState().setSearchResults(results)
  }
}, 300)
```

## Real-World Examples from Truck Tracker

### Truck Position Updates
```typescript
// Real-time truck position updates
updateTruckPosition: (truckId: string, position: Position) => {
  set((state) => ({
    trucks: state.trucks.map(truck =>
      truck.id === truckId
        ? { 
            ...truck, 
            currentPosition: position,
            lastUpdate: new Date().toISOString(),
            // Calculate speed and heading if needed
            speed: calculateSpeed(truck.currentPosition, position),
            heading: calculateHeading(truck.currentPosition, position)
          }
        : truck
    ),
    lastUpdate: new Date().toISOString()
  }))
}
```

### Alert Management
```typescript
// Add alert with automatic cleanup
addAlert: (truckId: string, alert: Alert) => {
  set((state) => {
    const truck = state.trucks.find(t => t.id === truckId)
    if (!truck) return state
    
    const updatedTrucks = state.trucks.map(t =>
      t.id === truckId
        ? { 
            ...t, 
            alerts: [...t.alerts, alert].slice(-5) // Keep only last 5 alerts
          }
        : t
    )
    
    return { trucks: updatedTrucks }
  })
  
  // Auto-remove alert after 5 minutes
  setTimeout(() => {
    useStore.getState().removeAlert(truckId, alert.id)
  }, 5 * 60 * 1000)
}
```

### Filter Application
```typescript
// Apply multiple filters efficiently
setTruckFilters: (filters: Partial<TruckFilters>) => {
  set((state) => {
    const newFilters = { ...state.filters, ...filters }
    
    // Clear selection if selected truck doesn't match new filters
    const selectedTruck = state.trucks.find(t => t.id === state.ui.selectedTruckId)
    const selectedTruckMatchesFilters = selectedTruck && 
      matchesTruckFilters(selectedTruck, newFilters)
    
    return {
      filters: newFilters,
      ui: {
        ...state.ui,
        selectedTruckId: selectedTruckMatchesFilters 
          ? state.ui.selectedTruckId 
          : null
      }
    }
  })
}
```

## Common Mistakes to Avoid

### 1. Mutating State Directly
```typescript
// ❌ Don't mutate state directly
const badUpdate = () => {
  const state = get()
  state.trucks.push(newTruck) // Mutation!
  set(state)
}

// ✅ Always create new objects/arrays
const goodUpdate = () => set((state) => ({
  trucks: [...state.trucks, newTruck]
}))
```

### 2. Unnecessary State Spreading
```typescript
// ❌ Don't spread entire state unnecessarily
const badUpdate = () => set((state) => ({
  ...state,
  count: state.count + 1
}))

// ✅ Update only what changed
const goodUpdate = () => set((state) => ({
  count: state.count + 1
}))
```

### 3. Complex Logic in Set Function
```typescript
// ❌ Don't put complex logic in set function
const badUpdate = () => set((state) => {
  // Complex calculations here...
  const result = complexCalculation(state)
  return { result }
})

// ✅ Calculate outside, then set
const goodUpdate = () => {
  const result = complexCalculation(get())
  set({ result })
}
```

## Best Practices

1. **Keep updates simple and focused**
2. **Use immutable patterns consistently**
3. **Batch related updates together**
4. **Consider performance implications**
5. **Handle errors gracefully**
6. **Use TypeScript for type safety**
7. **Test update logic thoroughly**

## Next Steps

- Learn about **Selectors** for efficient data access
- Explore **Middleware** for advanced functionality
- Understand **Testing** strategies for state updates
