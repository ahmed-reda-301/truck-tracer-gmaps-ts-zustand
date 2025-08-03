# TypeScript Integration

## Overview

Zustand provides excellent TypeScript support out of the box. This document covers how to leverage TypeScript effectively with Zustand for type-safe state management.

## Basic TypeScript Setup

### Store Interface Definition

```typescript
// Define your state interface
interface TruckState {
  trucks: Truck[]
  selectedTruckId: string | null
  isLoading: boolean
  error: string | null
}

// Define your actions interface
interface TruckActions {
  loadTrucks: () => Promise<void>
  selectTruck: (id: string) => void
  updateTruck: (id: string, updates: Partial<Truck>) => void
  clearError: () => void
}

// Combine state and actions
type TruckStore = TruckState & TruckActions
```

### Store Creation with Types

```typescript
import { create } from 'zustand'

const useTruckStore = create<TruckStore>((set, get) => ({
  // State
  trucks: [],
  selectedTruckId: null,
  isLoading: false,
  error: null,
  
  // Actions
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
  
  selectTruck: (id: string) => {
    set({ selectedTruckId: id })
  },
  
  updateTruck: (id: string, updates: Partial<Truck>) => {
    set((state) => ({
      trucks: state.trucks.map(truck =>
        truck.id === id ? { ...truck, ...updates } : truck
      )
    }))
  },
  
  clearError: () => {
    set({ error: null })
  }
}))
```

## Advanced TypeScript Patterns

### Generic Store Factory

```typescript
// Generic entity interface
interface Entity {
  id: string
  createdAt: string
  updatedAt: string
}

// Generic store state
interface EntityState<T extends Entity> {
  items: T[]
  selectedId: string | null
  isLoading: boolean
  error: string | null
}

// Generic store actions
interface EntityActions<T extends Entity> {
  loadItems: () => Promise<void>
  selectItem: (id: string) => void
  addItem: (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateItem: (id: string, updates: Partial<T>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

// Generic store type
type EntityStore<T extends Entity> = EntityState<T> & EntityActions<T>

// Generic store factory
function createEntityStore<T extends Entity>(
  entityName: string,
  fetchFn: () => Promise<T[]>,
  createFn: (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>,
  updateFn: (id: string, updates: Partial<T>) => Promise<T>,
  deleteFn: (id: string) => Promise<void>
) {
  return create<EntityStore<T>>((set, get) => ({
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
          error: error instanceof Error ? error.message : `Failed to load ${entityName}`,
          isLoading: false 
        })
      }
    },
    
    selectItem: (id: string) => {
      set({ selectedId: id })
    },
    
    addItem: async (item) => {
      set({ isLoading: true, error: null })
      try {
        const newItem = await createFn(item)
        set((state) => ({
          items: [...state.items, newItem],
          isLoading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : `Failed to create ${entityName}`,
          isLoading: false 
        })
      }
    },
    
    updateItem: async (id: string, updates: Partial<T>) => {
      set({ isLoading: true, error: null })
      try {
        const updatedItem = await updateFn(id, updates)
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? updatedItem : item
          ),
          isLoading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : `Failed to update ${entityName}`,
          isLoading: false 
        })
      }
    },
    
    deleteItem: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        await deleteFn(id)
        set((state) => ({
          items: state.items.filter(item => item.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          isLoading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : `Failed to delete ${entityName}`,
          isLoading: false 
        })
      }
    }
  }))
}

// Usage
interface Truck extends Entity {
  plateNumber: string
  driverName: string
  status: 'moving' | 'stopped' | 'completed'
}

const useTruckStore = createEntityStore<Truck>(
  'trucks',
  fetchTrucks,
  createTruck,
  updateTruck,
  deleteTruck
)
```

### Typed Selectors

```typescript
// Type-safe selector creator
function createSelector<TState, TResult>(
  selector: (state: TState) => TResult
): (state: TState) => TResult {
  return selector
}

// Usage with truck store
const selectTrucks = createSelector((state: TruckStore) => state.trucks)
const selectSelectedTruck = createSelector((state: TruckStore) => {
  const selectedId = state.selectedTruckId
  return selectedId ? state.trucks.find(truck => truck.id === selectedId) : null
})

// Parameterized selector
const selectTruckById = createSelector((state: TruckStore) => 
  (id: string) => state.trucks.find(truck => truck.id === id)
)

// Usage in components
function TruckList() {
  const trucks = useTruckStore(selectTrucks)
  const selectedTruck = useTruckStore(selectSelectedTruck)
  
  return (
    <div>
      {trucks.map(truck => (
        <div key={truck.id}>
          {truck.plateNumber} - {truck.status}
        </div>
      ))}
    </div>
  )
}
```

### Middleware with TypeScript

```typescript
import { StateCreator } from 'zustand'

// Typed middleware
const loggerMiddleware = <T>(
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

// Usage with types
const useTruckStore = create<TruckStore>()(
  loggerMiddleware(
    (set, get) => ({
      trucks: [],
      selectedTruckId: null,
      
      selectTruck: (id: string) => {
        set({ selectedTruckId: id })
      }
    }),
    'truck-store'
  )
)
```

## Type Utilities

### Store Type Extraction

```typescript
// Extract state type from store
type StoreState<T> = T extends (...args: any[]) => infer R ? R : never
type TruckStoreState = StoreState<typeof useTruckStore>

// Extract specific property types
type TruckArray = TruckStoreState['trucks']
type SelectedTruckId = TruckStoreState['selectedTruckId']
```

### Action Type Helpers

```typescript
// Extract action types
type ActionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

type StateKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K
}[keyof T]

// Usage
type TruckActions = Pick<TruckStore, ActionKeys<TruckStore>>
type TruckState = Pick<TruckStore, StateKeys<TruckStore>>
```

### Validation Types

```typescript
// Runtime type validation
interface TruckValidator {
  id: string
  plateNumber: string
  driverName: string
  status: 'moving' | 'stopped' | 'completed'
  currentPosition: {
    lat: number
    lng: number
  }
}

function validateTruck(data: unknown): data is TruckValidator {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'plateNumber' in data &&
    'driverName' in data &&
    'status' in data &&
    'currentPosition' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).plateNumber === 'string' &&
    typeof (data as any).driverName === 'string' &&
    ['moving', 'stopped', 'completed'].includes((data as any).status) &&
    typeof (data as any).currentPosition === 'object' &&
    typeof (data as any).currentPosition.lat === 'number' &&
    typeof (data as any).currentPosition.lng === 'number'
  )
}

// Usage in store
const loadTrucks = async () => {
  try {
    const response = await fetch('/api/trucks')
    const data = await response.json()
    
    if (Array.isArray(data) && data.every(validateTruck)) {
      set({ trucks: data })
    } else {
      throw new Error('Invalid truck data format')
    }
  } catch (error) {
    set({ error: 'Failed to load trucks' })
  }
}
```

## Component Integration

### Typed Hook Usage

```typescript
// Custom typed hooks
export const useSelectedTruck = (): Truck | null => {
  return useTruckStore(state => {
    const selectedId = state.selectedTruckId
    return selectedId ? state.trucks.find(truck => truck.id === selectedId) || null : null
  })
}

export const useTruckActions = () => {
  return useTruckStore(state => ({
    loadTrucks: state.loadTrucks,
    selectTruck: state.selectTruck,
    updateTruck: state.updateTruck,
    clearError: state.clearError
  }))
}

// Component with full type safety
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
      <p>Driver: {truck.driverName}</p>
      <p>Status: {truck.status}</p>
    </div>
  )
}
```

### Event Handling Types

```typescript
// Typed event handlers
interface TruckEventHandlers {
  onTruckSelect: (truckId: string) => void
  onTruckUpdate: (truckId: string, updates: Partial<Truck>) => void
  onTruckDelete: (truckId: string) => void
}

const TruckManager: React.FC = () => {
  const { selectTruck, updateTruck, deleteItem } = useTruckActions()
  
  const handlers: TruckEventHandlers = {
    onTruckSelect: selectTruck,
    onTruckUpdate: updateTruck,
    onTruckDelete: deleteItem
  }
  
  return <TruckList {...handlers} />
}
```

## Error Handling with Types

### Typed Error States

```typescript
// Define error types
type TruckError = 
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'VALIDATION_ERROR'; field: string; message: string }
  | { type: 'PERMISSION_ERROR'; action: string }
  | { type: 'NOT_FOUND_ERROR'; resourceId: string }

interface TruckStoreWithTypedErrors {
  trucks: Truck[]
  error: TruckError | null
  
  setError: (error: TruckError) => void
  clearError: () => void
}

// Error handling in actions
const loadTrucks = async () => {
  try {
    const trucks = await fetchTrucks()
    set({ trucks, error: null })
  } catch (error) {
    if (error instanceof NetworkError) {
      set({ error: { type: 'NETWORK_ERROR', message: error.message } })
    } else if (error instanceof ValidationError) {
      set({ error: { type: 'VALIDATION_ERROR', field: error.field, message: error.message } })
    } else {
      set({ error: { type: 'NETWORK_ERROR', message: 'Unknown error occurred' } })
    }
  }
}
```

## Testing with TypeScript

### Typed Test Helpers

```typescript
// Test store factory
function createTestStore<T>(initialState: Partial<T> = {}): T {
  const store = create<T>(() => initialState as T)
  return store.getState()
}

// Mock store with types
const createMockTruckStore = (overrides: Partial<TruckStore> = {}) => {
  return create<TruckStore>(() => ({
    trucks: [],
    selectedTruckId: null,
    isLoading: false,
    error: null,
    loadTrucks: jest.fn(),
    selectTruck: jest.fn(),
    updateTruck: jest.fn(),
    clearError: jest.fn(),
    ...overrides
  }))
}

// Test with type safety
describe('TruckStore', () => {
  it('should select truck correctly', () => {
    const store = createMockTruckStore({
      trucks: [
        { id: '1', plateNumber: 'ABC-123', driverName: 'John', status: 'moving' }
      ]
    })
    
    store.getState().selectTruck('1')
    expect(store.getState().selectedTruckId).toBe('1')
  })
})
```

## Best Practices

### 1. Use Strict TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. Define Clear Interfaces

```typescript
// ✅ Good - clear, specific interfaces
interface TruckPosition {
  lat: number
  lng: number
  timestamp: string
  accuracy?: number
}

interface TruckAlert {
  id: string
  type: 'speed' | 'fuel' | 'maintenance'
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: string
}

// ❌ Bad - vague, any types
interface BadTruck {
  data: any
  info: object
  stuff: unknown
}
```

### 3. Use Discriminated Unions

```typescript
// ✅ Good - discriminated union for different states
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Truck[] }
  | { status: 'error'; error: string }

interface TruckStore {
  loadingState: LoadingState
  
  loadTrucks: () => Promise<void>
}
```

### 4. Leverage Type Guards

```typescript
// Type guard functions
function isTruck(obj: unknown): obj is Truck {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'plateNumber' in obj
  )
}

// Usage in store
const addTruck = (truckData: unknown) => {
  if (isTruck(truckData)) {
    set((state) => ({
      trucks: [...state.trucks, truckData]
    }))
  } else {
    set({ error: 'Invalid truck data' })
  }
}
```

## Common TypeScript Issues and Solutions

### Issue 1: Circular Dependencies
```typescript
// ❌ Problem: Circular dependency
// store.ts imports types from components
// components.ts imports store

// ✅ Solution: Separate types file
// types.ts - shared types
// store.ts - imports from types.ts
// components.ts - imports from types.ts and store.ts
```

### Issue 2: Complex State Updates
```typescript
// ✅ Use helper functions for complex updates
const updateTruckInList = (
  trucks: Truck[], 
  truckId: string, 
  updates: Partial<Truck>
): Truck[] => {
  return trucks.map(truck =>
    truck.id === truckId ? { ...truck, ...updates } : truck
  )
}

// Usage in store
const updateTruck = (id: string, updates: Partial<Truck>) => {
  set((state) => ({
    trucks: updateTruckInList(state.trucks, id, updates)
  }))
}
```

TypeScript integration with Zustand provides excellent developer experience with full type safety, IntelliSense support, and compile-time error checking. Following these patterns will help you build robust, maintainable applications.
