# Selectors and Performance

## Overview

Selectors are functions that extract specific pieces of data from your Zustand store. They are crucial for performance optimization as they determine when components re-render. This document covers selector patterns, performance optimization, and best practices.

## Basic Selectors

### Simple Property Selection
```typescript
const useStore = create<State>(() => ({
  trucks: [],
  selectedTruckId: null,
  isLoading: false
}))

// Component usage
function TruckList() {
  // ✅ Select only what you need
  const trucks = useStore(state => state.trucks)
  const isLoading = useStore(state => state.isLoading)
  
  // ❌ Don't select entire state unless needed
  const entireState = useStore() // This causes re-renders on any change
  
  return <div>{/* Component JSX */}</div>
}
```

### Multiple Property Selection
```typescript
// ✅ Good - single subscription with object selector
const { trucks, isLoading, error } = useStore(state => ({
  trucks: state.trucks,
  isLoading: state.isLoading,
  error: state.error
}))

// ❌ Less efficient - multiple subscriptions
const trucks = useStore(state => state.trucks)
const isLoading = useStore(state => state.isLoading)
const error = useStore(state => state.error)
```

## Advanced Selector Patterns

### Computed Selectors
Create derived data without storing it in state:

```typescript
// Computed values as selectors
const useFilteredTrucks = () => 
  useStore(state => {
    const { trucks, filters } = state
    return trucks.filter(truck => {
      if (filters.status && truck.status !== filters.status) return false
      if (filters.company && truck.company !== filters.company) return false
      return true
    })
  })

const useTruckStats = () =>
  useStore(state => {
    const trucks = state.trucks
    return {
      total: trucks.length,
      moving: trucks.filter(t => t.status === 'moving').length,
      stopped: trucks.filter(t => t.status === 'stopped').length,
      averageSpeed: trucks.reduce((sum, t) => sum + t.speed, 0) / trucks.length
    }
  })
```

### Parameterized Selectors
Create selectors that accept parameters:

```typescript
// Selector factory for finding truck by ID
const useTruckById = (truckId: string) =>
  useStore(state => 
    state.trucks.find(truck => truck.id === truckId)
  )

// Selector for trucks by company
const useTrucksByCompany = (company: string) =>
  useStore(state =>
    state.trucks.filter(truck => truck.company === company)
  )

// Selector for trucks within radius
const useTrucksInRadius = (center: Position, radius: number) =>
  useStore(state =>
    state.trucks.filter(truck => 
      calculateDistance(truck.currentPosition, center) <= radius
    )
  )
```

### Memoized Selectors
Use memoization for expensive computations:

```typescript
import { useMemo } from 'react'

// Memoized selector for complex calculations
const useRouteAnalytics = () => {
  const { trucks, routes } = useStore(state => ({
    trucks: state.trucks,
    routes: state.routes
  }))
  
  return useMemo(() => {
    // Expensive calculation
    return routes.map(route => {
      const routeTrucks = trucks.filter(t => t.route === route.id)
      return {
        routeId: route.id,
        routeName: route.name,
        truckCount: routeTrucks.length,
        averageSpeed: routeTrucks.reduce((sum, t) => sum + t.speed, 0) / routeTrucks.length,
        totalDistance: route.distance,
        estimatedTime: route.estimatedTime,
        alerts: routeTrucks.flatMap(t => t.alerts).length
      }
    })
  }, [trucks, routes])
}
```

## Performance Optimization

### Shallow Comparison
Zustand uses shallow comparison by default. Structure your selectors accordingly:

```typescript
// ✅ Good - returns primitive or shallow object
const useSimpleData = () => useStore(state => ({
  count: state.count,
  name: state.name
}))

// ❌ Problematic - creates new array every time
const useBadSelector = () => useStore(state => 
  state.trucks.map(truck => truck.name) // New array reference each time
)

// ✅ Better - use useMemo for derived arrays
const useTruckNames = () => {
  const trucks = useStore(state => state.trucks)
  return useMemo(() => 
    trucks.map(truck => truck.name), 
    [trucks]
  )
}
```

### Custom Equality Functions
Use custom equality functions for deep comparisons:

```typescript
import { shallow } from 'zustand/shallow'

// Use shallow comparison for objects
const useShallowSelector = () => useStore(
  state => ({
    trucks: state.trucks,
    filters: state.filters
  }),
  shallow
)

// Custom equality function
const useCustomEquality = () => useStore(
  state => state.complexObject,
  (a, b) => JSON.stringify(a) === JSON.stringify(b) // Not recommended for performance
)

// Better custom equality for specific use cases
const useTruckPositions = () => useStore(
  state => state.trucks.map(t => ({ id: t.id, position: t.currentPosition })),
  (a, b) => a.length === b.length && a.every((item, i) => 
    item.id === b[i].id && 
    item.position.lat === b[i].position.lat &&
    item.position.lng === b[i].position.lng
  )
)
```

### Selector Hooks Pattern
Create reusable selector hooks:

```typescript
// Custom selector hooks
export const useSelectedTruck = () => 
  useStore(state => {
    const selectedId = state.ui.selectedTruckId
    return selectedId ? state.trucks.find(truck => truck.id === selectedId) : null
  })

export const useFilteredTrucks = () =>
  useStore(state => {
    const { trucks, filters } = state
    
    return trucks.filter(truck => {
      // Origin filter
      if (filters.origin && truck.origin.name !== filters.origin) {
        return false
      }
      
      // Status filter
      if (filters.status && filters.status.length > 0 && !filters.status.includes(truck.status)) {
        return false
      }
      
      // Alert filter
      if (filters.hasAlerts !== undefined) {
        const hasAlerts = truck.alerts.length > 0
        if (filters.hasAlerts !== hasAlerts) {
          return false
        }
      }
      
      return true
    })
  })

export const useTruckStats = () =>
  useStore(state => {
    const trucks = state.trucks
    
    return {
      total: trucks.length,
      moving: trucks.filter(t => t.status === 'moving').length,
      stopped: trucks.filter(t => t.status === 'stopped').length,
      completed: trucks.filter(t => t.status === 'completed').length,
      withAlerts: trucks.filter(t => t.alerts.length > 0).length,
      averageSpeed: trucks.reduce((sum, t) => sum + t.speed, 0) / trucks.length || 0
    }
  })

export const useAlertStats = () =>
  useStore(state => {
    const trucks = state.trucks
    const allAlerts = trucks.flatMap(truck => truck.alerts)
    
    const stats = {
      speed: { count: 0, critical: 0, warning: 0, info: 0 },
      lock: { count: 0, critical: 0, warning: 0, info: 0 },
      direction: { count: 0, critical: 0, warning: 0, info: 0 },
      stop: { count: 0, critical: 0, warning: 0, info: 0 },
      battery: { count: 0, critical: 0, warning: 0, info: 0 },
      fuel: { count: 0, critical: 0, warning: 0, info: 0 },
      temperature: { count: 0, critical: 0, warning: 0, info: 0 }
    }
    
    allAlerts.forEach(alert => {
      if (stats[alert.type]) {
        stats[alert.type].count++
        stats[alert.type][alert.severity]++
      }
    })
    
    return stats
  })
```

## Selector Composition

### Combining Selectors
```typescript
// Base selectors
const useTrucks = () => useStore(state => state.trucks)
const useFilters = () => useStore(state => state.filters)

// Composed selector
const useFilteredTrucks = () => {
  const trucks = useTrucks()
  const filters = useFilters()
  
  return useMemo(() => 
    trucks.filter(truck => matchesFilters(truck, filters)),
    [trucks, filters]
  )
}

// Higher-order selector
const createTruckSelector = <T>(transform: (truck: Truck) => T) => 
  (truckId: string) => useStore(state => {
    const truck = state.trucks.find(t => t.id === truckId)
    return truck ? transform(truck) : null
  })

// Usage
const useTruckName = createTruckSelector(truck => truck.plateNumber)
const useTruckStatus = createTruckSelector(truck => truck.status)
const useTruckPosition = createTruckSelector(truck => truck.currentPosition)
```

### Selector Factories
```typescript
// Factory for creating filtered selectors
const createFilteredSelector = <T>(
  selector: (state: State) => T[],
  predicate: (item: T) => boolean
) => () => useStore(state => selector(state).filter(predicate))

// Usage
const useActiveTrucks = createFilteredSelector(
  state => state.trucks,
  truck => truck.status === 'moving'
)

const useAlertsWithSeverity = (severity: AlertSeverity) => 
  createFilteredSelector(
    state => state.trucks.flatMap(t => t.alerts),
    alert => alert.severity === severity
  )()
```

## Real-World Examples

### Dashboard Selectors
```typescript
// Dashboard data selector
export const useDashboardData = () => useStore(state => {
  const trucks = state.trucks
  const routes = state.routes
  
  return {
    // Basic stats
    totalTrucks: trucks.length,
    activeTrucks: trucks.filter(t => t.status === 'moving').length,
    
    // Route distribution
    routeDistribution: routes.map(route => ({
      routeId: route.id,
      routeName: route.name,
      truckCount: trucks.filter(t => t.route === route.id).length
    })),
    
    // Recent alerts
    recentAlerts: trucks
      .flatMap(truck => truck.alerts.map(alert => ({ ...alert, truckId: truck.id })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10),
    
    // Performance metrics
    averageSpeed: trucks.reduce((sum, t) => sum + t.speed, 0) / trucks.length || 0,
    fuelEfficiency: trucks.reduce((sum, t) => sum + t.fuel, 0) / trucks.length || 0
  }
})
```

### Map Selectors
```typescript
// Map-specific selectors
export const useMapData = () => useStore(state => ({
  trucks: state.trucks.map(truck => ({
    id: truck.id,
    position: truck.currentPosition,
    heading: truck.heading,
    status: truck.status,
    plateNumber: truck.plateNumber
  })),
  selectedTruckId: state.ui.selectedTruckId,
  showRoutes: state.ui.showRoutes,
  mapViewport: state.ui.mapViewport
}))

export const useVisibleTrucks = () => useStore(state => {
  const { trucks, ui } = state
  const { mapViewport } = ui
  
  // Only return trucks within current viewport
  return trucks.filter(truck => 
    isWithinBounds(truck.currentPosition, mapViewport.bounds)
  )
})
```

## Performance Best Practices

### 1. Select Minimal Data
```typescript
// ✅ Good - select only what's needed
const TruckItem = ({ truckId }: { truckId: string }) => {
  const truck = useStore(state => 
    state.trucks.find(t => t.id === truckId)
  )
  
  return <div>{truck?.plateNumber}</div>
}

// ❌ Bad - selecting entire trucks array
const TruckItem = ({ truckId }: { truckId: string }) => {
  const trucks = useStore(state => state.trucks)
  const truck = trucks.find(t => t.id === truckId)
  
  return <div>{truck?.plateNumber}</div>
}
```

### 2. Use Stable References
```typescript
// ✅ Good - stable selector function
const selectTruckNames = (state: State) => state.trucks.map(t => t.plateNumber)
const useTruckNames = () => useStore(selectTruckNames)

// ❌ Bad - new function every render
const useTruckNames = () => useStore(state => state.trucks.map(t => t.plateNumber))
```

### 3. Memoize Complex Calculations
```typescript
// ✅ Good - memoized complex selector
export const useRouteAnalytics = () => {
  const trucks = useStore(state => state.trucks)
  const routes = useStore(state => state.routes)
  
  return useMemo(() => {
    // Complex calculation here
    return calculateRouteAnalytics(trucks, routes)
  }, [trucks, routes])
}
```

### 4. Use Shallow Comparison When Appropriate
```typescript
import { shallow } from 'zustand/shallow'

// For objects that change frequently but shallowly
const useUIState = () => useStore(
  state => ({
    theme: state.ui.theme,
    sidebarOpen: state.ui.sidebarOpen,
    filterPanelOpen: state.ui.filterPanelOpen
  }),
  shallow
)
```

## Testing Selectors

```typescript
import { renderHook } from '@testing-library/react'
import { useFilteredTrucks, useTruckStats } from './selectors'

describe('Truck Selectors', () => {
  beforeEach(() => {
    // Setup test store state
    useStore.setState({
      trucks: mockTrucks,
      filters: mockFilters
    })
  })
  
  it('should filter trucks correctly', () => {
    const { result } = renderHook(() => useFilteredTrucks())
    expect(result.current).toHaveLength(2)
  })
  
  it('should calculate stats correctly', () => {
    const { result } = renderHook(() => useTruckStats())
    expect(result.current.total).toBe(5)
    expect(result.current.moving).toBe(3)
  })
})
```

## Common Pitfalls

### 1. Creating New Objects in Selectors
```typescript
// ❌ Bad - creates new object every time
const useBadSelector = () => useStore(state => ({
  ...state.truck, // New object reference
  displayName: `${state.truck.plateNumber} - ${state.truck.company}`
}))

// ✅ Good - use useMemo for derived objects
const useGoodSelector = () => {
  const truck = useStore(state => state.truck)
  return useMemo(() => ({
    ...truck,
    displayName: `${truck.plateNumber} - ${truck.company}`
  }), [truck])
}
```

### 2. Over-selecting Data
```typescript
// ❌ Bad - component re-renders on any truck change
const TruckCount = () => {
  const trucks = useStore(state => state.trucks)
  return <div>Total: {trucks.length}</div>
}

// ✅ Good - only re-renders when count changes
const TruckCount = () => {
  const count = useStore(state => state.trucks.length)
  return <div>Total: {count}</div>
}
```

## Next Steps

- Learn about **Middleware** for advanced store functionality
- Explore **TypeScript** integration patterns
- Understand **Testing** strategies for selectors and stores
