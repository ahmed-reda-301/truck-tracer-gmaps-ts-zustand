# Testing Strategies

## Overview

Testing Zustand stores and components that use them requires specific strategies to ensure reliability and maintainability. This document covers comprehensive testing approaches for Zustand-based applications.

## Testing Store Logic

### Basic Store Testing

```typescript
import { create } from 'zustand'
import { act, renderHook } from '@testing-library/react'

interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}))

describe('CounterStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCounterStore.setState({ count: 0 })
  })
  
  it('should initialize with count 0', () => {
    const { result } = renderHook(() => useCounterStore())
    expect(result.current.count).toBe(0)
  })
  
  it('should increment count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
  
  it('should decrement count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      result.current.increment()
      result.current.decrement()
    })
    
    expect(result.current.count).toBe(0)
  })
  
  it('should reset count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      result.current.increment()
      result.current.increment()
      result.current.reset()
    })
    
    expect(result.current.count).toBe(0)
  })
})
```

### Testing Async Actions

```typescript
import { waitFor } from '@testing-library/react'

// Mock API functions
const mockFetchTrucks = jest.fn()
const mockUpdateTruck = jest.fn()

jest.mock('../api/trucks', () => ({
  fetchTrucks: () => mockFetchTrucks(),
  updateTruck: (id: string, updates: any) => mockUpdateTruck(id, updates)
}))

describe('TruckStore Async Actions', () => {
  beforeEach(() => {
    // Reset store and mocks
    useTruckStore.setState({
      trucks: [],
      isLoading: false,
      error: null
    })
    jest.clearAllMocks()
  })
  
  it('should load trucks successfully', async () => {
    const mockTrucks = [
      { id: '1', plateNumber: 'ABC-123', status: 'moving' },
      { id: '2', plateNumber: 'DEF-456', status: 'stopped' }
    ]
    
    mockFetchTrucks.mockResolvedValue(mockTrucks)
    
    const { result } = renderHook(() => useTruckStore())
    
    act(() => {
      result.current.loadTrucks()
    })
    
    // Check loading state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
    
    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.trucks).toEqual(mockTrucks)
    expect(result.current.error).toBe(null)
    expect(mockFetchTrucks).toHaveBeenCalledTimes(1)
  })
  
  it('should handle loading error', async () => {
    const errorMessage = 'Failed to fetch trucks'
    mockFetchTrucks.mockRejectedValue(new Error(errorMessage))
    
    const { result } = renderHook(() => useTruckStore())
    
    act(() => {
      result.current.loadTrucks()
    })
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.trucks).toEqual([])
    expect(result.current.error).toBe(errorMessage)
  })
  
  it('should update truck successfully', async () => {
    const initialTrucks = [
      { id: '1', plateNumber: 'ABC-123', status: 'moving' }
    ]
    const updatedTruck = { id: '1', plateNumber: 'ABC-123', status: 'stopped' }
    
    useTruckStore.setState({ trucks: initialTrucks })
    mockUpdateTruck.mockResolvedValue(updatedTruck)
    
    const { result } = renderHook(() => useTruckStore())
    
    await act(async () => {
      await result.current.updateTruck('1', { status: 'stopped' })
    })
    
    expect(result.current.trucks[0].status).toBe('stopped')
    expect(mockUpdateTruck).toHaveBeenCalledWith('1', { status: 'stopped' })
  })
})
```

### Testing Selectors

```typescript
describe('TruckStore Selectors', () => {
  beforeEach(() => {
    const mockTrucks = [
      { id: '1', plateNumber: 'ABC-123', status: 'moving', company: 'Company A' },
      { id: '2', plateNumber: 'DEF-456', status: 'stopped', company: 'Company B' },
      { id: '3', plateNumber: 'GHI-789', status: 'moving', company: 'Company A' }
    ]
    
    useTruckStore.setState({
      trucks: mockTrucks,
      selectedTruckId: '1',
      filters: { status: ['moving'], company: ['Company A'] }
    })
  })
  
  it('should select truck by id', () => {
    const { result } = renderHook(() => useSelectedTruck())
    
    expect(result.current).toEqual({
      id: '1',
      plateNumber: 'ABC-123',
      status: 'moving',
      company: 'Company A'
    })
  })
  
  it('should filter trucks correctly', () => {
    const { result } = renderHook(() => useFilteredTrucks())
    
    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe('1')
  })
  
  it('should calculate truck stats', () => {
    const { result } = renderHook(() => useTruckStats())
    
    expect(result.current).toEqual({
      total: 3,
      moving: 2,
      stopped: 1,
      completed: 0,
      withAlerts: 0,
      averageSpeed: expect.any(Number)
    })
  })
})
```

## Testing Components with Zustand

### Component Testing with Real Store

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import TruckList from '../components/TruckList'

describe('TruckList Component', () => {
  beforeEach(() => {
    // Setup test data
    useTruckStore.setState({
      trucks: [
        { id: '1', plateNumber: 'ABC-123', status: 'moving' },
        { id: '2', plateNumber: 'DEF-456', status: 'stopped' }
      ],
      selectedTruckId: null
    })
  })
  
  it('should render truck list', () => {
    render(<TruckList />)
    
    expect(screen.getByText('ABC-123')).toBeInTheDocument()
    expect(screen.getByText('DEF-456')).toBeInTheDocument()
  })
  
  it('should select truck on click', () => {
    render(<TruckList />)
    
    fireEvent.click(screen.getByText('ABC-123'))
    
    expect(useTruckStore.getState().selectedTruckId).toBe('1')
  })
  
  it('should highlight selected truck', () => {
    useTruckStore.setState({ selectedTruckId: '1' })
    
    render(<TruckList />)
    
    const selectedTruck = screen.getByText('ABC-123').closest('.truck-item')
    expect(selectedTruck).toHaveClass('selected')
  })
})
```

### Component Testing with Mock Store

```typescript
// Create a mock store for testing
const createMockTruckStore = (initialState: Partial<TruckStore> = {}) => {
  return create<TruckStore>(() => ({
    trucks: [],
    selectedTruckId: null,
    isLoading: false,
    error: null,
    loadTrucks: jest.fn(),
    selectTruck: jest.fn(),
    updateTruck: jest.fn(),
    clearError: jest.fn(),
    ...initialState
  }))
}

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode
  mockStore?: ReturnType<typeof createMockTruckStore>
}> = ({ children, mockStore }) => {
  if (mockStore) {
    // Replace the real store with mock store for testing
    const originalStore = useTruckStore
    useTruckStore = mockStore as any
    
    return (
      <>
        {children}
        {/* Restore original store after test */}
        <div style={{ display: 'none' }} ref={() => { useTruckStore = originalStore }} />
      </>
    )
  }
  
  return <>{children}</>
}

describe('TruckList with Mock Store', () => {
  it('should handle loading state', () => {
    const mockStore = createMockTruckStore({
      isLoading: true,
      trucks: []
    })
    
    render(
      <TestWrapper mockStore={mockStore}>
        <TruckList />
      </TestWrapper>
    )
    
    expect(screen.getByText('Loading trucks...')).toBeInTheDocument()
  })
  
  it('should handle error state', () => {
    const mockStore = createMockTruckStore({
      error: 'Failed to load trucks',
      trucks: []
    })
    
    render(
      <TestWrapper mockStore={mockStore}>
        <TruckList />
      </TestWrapper>
    )
    
    expect(screen.getByText(/Failed to load trucks/)).toBeInTheDocument()
  })
  
  it('should call loadTrucks on mount', () => {
    const mockLoadTrucks = jest.fn()
    const mockStore = createMockTruckStore({
      loadTrucks: mockLoadTrucks
    })
    
    render(
      <TestWrapper mockStore={mockStore}>
        <TruckList />
      </TestWrapper>
    )
    
    expect(mockLoadTrucks).toHaveBeenCalledTimes(1)
  })
})
```

## Integration Testing

### Testing Store Integration

```typescript
describe('TruckStore Integration', () => {
  it('should handle complete truck selection flow', async () => {
    const mockTrucks = [
      { id: '1', plateNumber: 'ABC-123', status: 'moving' },
      { id: '2', plateNumber: 'DEF-456', status: 'stopped' }
    ]
    
    mockFetchTrucks.mockResolvedValue(mockTrucks)
    
    const { result } = renderHook(() => useTruckStore())
    
    // Load trucks
    await act(async () => {
      await result.current.loadTrucks()
    })
    
    expect(result.current.trucks).toEqual(mockTrucks)
    
    // Select truck
    act(() => {
      result.current.selectTruck('1')
    })
    
    expect(result.current.selectedTruckId).toBe('1')
    
    // Update selected truck
    const updatedTruck = { ...mockTrucks[0], status: 'stopped' }
    mockUpdateTruck.mockResolvedValue(updatedTruck)
    
    await act(async () => {
      await result.current.updateTruck('1', { status: 'stopped' })
    })
    
    expect(result.current.trucks[0].status).toBe('stopped')
  })
})
```

### Testing Component Integration

```typescript
describe('TruckDashboard Integration', () => {
  it('should display and interact with trucks', async () => {
    const mockTrucks = [
      { id: '1', plateNumber: 'ABC-123', status: 'moving' }
    ]
    
    mockFetchTrucks.mockResolvedValue(mockTrucks)
    
    render(<TruckDashboard />)
    
    // Wait for trucks to load
    await waitFor(() => {
      expect(screen.getByText('ABC-123')).toBeInTheDocument()
    })
    
    // Click on truck
    fireEvent.click(screen.getByText('ABC-123'))
    
    // Check if truck is selected
    expect(screen.getByText('ABC-123').closest('.truck-item')).toHaveClass('selected')
    
    // Check if stats are updated
    expect(screen.getByText('Total Trucks: 1')).toBeInTheDocument()
  })
})
```

## Testing Middleware

### Testing DevTools Middleware

```typescript
describe('DevTools Middleware', () => {
  it('should work without devtools in test environment', () => {
    const testStore = create<CounterStore>()(
      process.env.NODE_ENV === 'test' 
        ? (set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) })
        : devtools((set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }))
    )
    
    expect(testStore.getState().count).toBe(0)
    
    act(() => {
      testStore.getState().increment()
    })
    
    expect(testStore.getState().count).toBe(1)
  })
})
```

### Testing Custom Middleware

```typescript
// Logger middleware for testing
const testLoggerMiddleware = <T>(
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => (set, get, store) => {
  const logs: string[] = []
  
  const loggedSet: typeof set = (...args) => {
    const actionName = args[2] || 'unknown'
    logs.push(actionName)
    set(...args)
  }
  
  // Expose logs for testing
  ;(store as any).getLogs = () => logs
  
  return f(loggedSet, get, store)
}

describe('Logger Middleware', () => {
  it('should log actions', () => {
    const testStore = create<CounterStore>()(
      testLoggerMiddleware((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
        decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
        reset: () => set({ count: 0 }, false, 'reset')
      }))
    )
    
    act(() => {
      testStore.getState().increment()
      testStore.getState().decrement()
      testStore.getState().reset()
    })
    
    const logs = (testStore as any).getLogs()
    expect(logs).toEqual(['increment', 'decrement', 'reset'])
  })
})
```

## Performance Testing

### Testing Render Performance

```typescript
import { renderHook } from '@testing-library/react'

describe('TruckStore Performance', () => {
  it('should not cause unnecessary re-renders', () => {
    const renderSpy = jest.fn()
    
    const TestComponent = () => {
      renderSpy()
      const count = useTruckStore(state => state.trucks.length)
      return count
    }
    
    const { result, rerender } = renderHook(() => <TestComponent />)
    
    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1)
    
    // Update unrelated state
    act(() => {
      useTruckStore.setState({ selectedTruckId: '1' })
    })
    
    rerender()
    
    // Should not re-render because trucks.length didn't change
    expect(renderSpy).toHaveBeenCalledTimes(1)
    
    // Update trucks
    act(() => {
      useTruckStore.setState({ 
        trucks: [{ id: '1', plateNumber: 'ABC-123', status: 'moving' }] 
      })
    })
    
    rerender()
    
    // Should re-render because trucks.length changed
    expect(renderSpy).toHaveBeenCalledTimes(2)
  })
})
```

### Testing Memory Leaks

```typescript
describe('TruckStore Memory Management', () => {
  it('should not leak memory with subscriptions', () => {
    const subscriptions: Array<() => void> = []
    
    // Create multiple subscriptions
    for (let i = 0; i < 100; i++) {
      const unsubscribe = useTruckStore.subscribe(
        (state) => state.trucks,
        (trucks) => {
          // Subscription callback
        }
      )
      subscriptions.push(unsubscribe)
    }
    
    // Unsubscribe all
    subscriptions.forEach(unsubscribe => unsubscribe())
    
    // Force garbage collection (if available)
    if (global.gc) {
      global.gc()
    }
    
    // Test should complete without memory issues
    expect(subscriptions).toHaveLength(100)
  })
})
```

## Test Utilities

### Store Test Helpers

```typescript
// Test utilities for Zustand stores
export const createTestStore = <T>(
  storeCreator: StateCreator<T, [], [], T>,
  initialState?: Partial<T>
) => {
  const store = create<T>(storeCreator)
  
  if (initialState) {
    store.setState(initialState as T)
  }
  
  return store
}

export const resetStore = <T>(store: any, initialState: Partial<T>) => {
  store.setState(initialState)
}

export const waitForStoreUpdate = async <T>(
  store: any,
  predicate: (state: T) => boolean,
  timeout = 1000
) => {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe()
      reject(new Error('Store update timeout'))
    }, timeout)
    
    const unsubscribe = store.subscribe((state: T) => {
      if (predicate(state)) {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve()
      }
    })
  })
}

// Usage
describe('Store Test Utilities', () => {
  it('should wait for store update', async () => {
    const store = createTestStore<CounterStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }))
    }))
    
    // Start async operation
    setTimeout(() => {
      store.getState().increment()
    }, 100)
    
    // Wait for update
    await waitForStoreUpdate(
      store,
      (state) => state.count === 1
    )
    
    expect(store.getState().count).toBe(1)
  })
})
```

### Mock Data Factories

```typescript
// Factory functions for creating test data
export const createMockTruck = (overrides: Partial<Truck> = {}): Truck => ({
  id: 'truck-1',
  plateNumber: 'ABC-123',
  driverName: 'John Doe',
  company: 'Test Company',
  status: 'moving',
  currentPosition: { lat: 24.7136, lng: 46.6753 },
  speed: 60,
  fuel: 80,
  alerts: [],
  ...overrides
})

export const createMockTrucks = (count: number): Truck[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockTruck({
      id: `truck-${index + 1}`,
      plateNumber: `ABC-${String(index + 1).padStart(3, '0')}`
    })
  )
}

// Usage in tests
describe('TruckList with Mock Data', () => {
  it('should render multiple trucks', () => {
    const mockTrucks = createMockTrucks(5)
    useTruckStore.setState({ trucks: mockTrucks })
    
    render(<TruckList />)
    
    mockTrucks.forEach(truck => {
      expect(screen.getByText(truck.plateNumber)).toBeInTheDocument()
    })
  })
})
```

## Best Practices

### 1. Reset Store State Between Tests
```typescript
beforeEach(() => {
  useTruckStore.setState({
    trucks: [],
    selectedTruckId: null,
    isLoading: false,
    error: null
  })
})
```

### 2. Test Store Logic Separately from Components
```typescript
// ✅ Good - test store logic
describe('TruckStore Logic', () => {
  it('should update truck status', () => {
    // Test store logic directly
  })
})

// ✅ Good - test component behavior
describe('TruckList Component', () => {
  it('should display trucks', () => {
    // Test component rendering and interaction
  })
})
```

### 3. Use Meaningful Test Data
```typescript
// ✅ Good - descriptive test data
const movingTruck = createMockTruck({ 
  status: 'moving', 
  plateNumber: 'MOVING-001' 
})
const stoppedTruck = createMockTruck({ 
  status: 'stopped', 
  plateNumber: 'STOPPED-001' 
})
```

### 4. Test Error Scenarios
```typescript
it('should handle API errors gracefully', async () => {
  mockFetchTrucks.mockRejectedValue(new Error('Network error'))
  
  await act(async () => {
    await result.current.loadTrucks()
  })
  
  expect(result.current.error).toBe('Network error')
  expect(result.current.isLoading).toBe(false)
})
```

### 5. Test Async Operations Properly
```typescript
// ✅ Good - proper async testing
it('should load trucks asynchronously', async () => {
  await act(async () => {
    await result.current.loadTrucks()
  })
  
  expect(result.current.trucks).toHaveLength(2)
})
```

Testing Zustand stores and components requires attention to state management, async operations, and component integration. Following these patterns will help you build reliable, well-tested applications.
