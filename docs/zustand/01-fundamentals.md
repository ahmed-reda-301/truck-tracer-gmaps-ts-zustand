# Zustand Fundamentals

## What is Zustand?

Zustand is a small, fast, and scalable state management solution for React applications. The name "Zustand" means "state" in German. It provides a simple API for managing application state without the complexity of other solutions like Redux.

## Key Characteristics

### 1. **Minimal Boilerplate**

- No providers or reducers required
- Direct state mutations
- Simple API surface

### 2. **TypeScript First**

- Excellent TypeScript support out of the box
- Type inference works seamlessly
- No additional type definitions needed

### 3. **Framework Agnostic**

- Works with React, but core is framework-independent
- Can be used in vanilla JavaScript
- Server-side rendering compatible

### 4. **Performance Optimized**

- Automatic shallow comparison
- Selective subscriptions
- No unnecessary re-renders

## Core Concepts

### 1. Store

A store is a container that holds your application state and provides methods to update it.

```typescript
import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### 2. State

State is the data that your application needs to track and manage.

```typescript
// Simple state
interface UserState {
  name: string;
  email: string;
  isLoggedIn: boolean;
}

// Complex state with nested objects
interface AppState {
  user: {
    profile: UserProfile;
    preferences: UserPreferences;
  };
  ui: {
    theme: "light" | "dark";
    sidebarOpen: boolean;
  };
  data: {
    trucks: Truck[];
    routes: Route[];
  };
}
```

### 3. Actions

Actions are functions that modify the state. In Zustand, actions are just regular functions stored in the state.

```typescript
const useStore = create<State>((set, get) => ({
  // State
  trucks: [],
  selectedTruck: null,

  // Actions
  addTruck: (truck: Truck) =>
    set((state) => ({ trucks: [...state.trucks, truck] })),

  selectTruck: (id: string) =>
    set({ selectedTruck: get().trucks.find((t) => t.id === id) || null }),

  updateTruckPosition: (id: string, position: Position) =>
    set((state) => ({
      trucks: state.trucks.map((truck) =>
        truck.id === id ? { ...truck, position } : truck
      ),
    })),
}));
```

### 4. Selectors

Selectors are functions that extract specific pieces of state from the store.

```typescript
// Using the store in components
function TruckList() {
  // Select only the trucks array
  const trucks = useStore((state) => state.trucks);

  // Select multiple values
  const { trucks, selectedTruck } = useStore((state) => ({
    trucks: state.trucks,
    selectedTruck: state.selectedTruck,
  }));

  // Select with computation
  const activeTrucks = useStore((state) =>
    state.trucks.filter((truck) => truck.status === "active")
  );

  return (
    <div>
      {trucks.map((truck) => (
        <TruckItem key={truck.id} truck={truck} />
      ))}
    </div>
  );
}
```

## Basic Store Creation

### Simple Store

```typescript
import { create } from "zustand";

interface SimpleState {
  count: number;
  text: string;
  increment: () => void;
  setText: (text: string) => void;
}

const useSimpleStore = create<SimpleState>((set) => ({
  count: 0,
  text: "",
  increment: () => set((state) => ({ count: state.count + 1 })),
  setText: (text: string) => set({ text }),
}));
```

### Store with Get Function

The `get` function allows you to access the current state within actions.

```typescript
const useAdvancedStore = create<AdvancedState>((set, get) => ({
  items: [],
  selectedId: null,

  addItem: (item: Item) => {
    const currentItems = get().items;
    set({ items: [...currentItems, item] });
  },

  selectItem: (id: string) => {
    const item = get().items.find((item) => item.id === id);
    if (item) {
      set({ selectedId: id });
    }
  },

  getSelectedItem: () => {
    const { items, selectedId } = get();
    return items.find((item) => item.id === selectedId) || null;
  },
}));
```

## State Updates

### Immutable Updates

Zustand requires immutable updates to trigger re-renders properly.

```typescript
// ✅ Correct - creates new objects
set((state) => ({
  trucks: [...state.trucks, newTruck],
}));

set((state) => ({
  trucks: state.trucks.map((truck) =>
    truck.id === id ? { ...truck, status: "inactive" } : truck
  ),
}));

// ❌ Wrong - mutates existing state
set((state) => {
  state.trucks.push(newTruck); // Don't do this!
  return state;
});
```

### Partial Updates

You can update only specific parts of the state.

```typescript
// Update only specific fields
set({ isLoading: true });
set({ error: null, isLoading: false });

// Merge with existing state
set((state) => ({ ...state, newField: "value" }));
```

## Using Stores in Components

### Basic Usage

```typescript
function TruckCounter() {
  const count = useStore((state) => state.trucks.length);
  const addTruck = useStore((state) => state.addTruck);

  return (
    <div>
      <p>Total trucks: {count}</p>
      <button onClick={() => addTruck(createNewTruck())}>Add Truck</button>
    </div>
  );
}
```

### Multiple Subscriptions

```typescript
function TruckDashboard() {
  // Each selector creates a separate subscription
  const trucks = useStore((state) => state.trucks);
  const selectedTruck = useStore((state) => state.selectedTruck);
  const isLoading = useStore((state) => state.isLoading);

]  // Or combine into one subscription
  const { trucks, selectedTruck, isLoading } = useStore((state) => ({
    trucks: state.trucks,
    selectedTruck: state.selectedTruck,
    isLoading: state.isLoading,
  }));

  return <div>{/* Component JSX */}</div>;
}
```

## Common Patterns

### Loading States

```typescript
interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any[];

  fetchData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  error: null,
  data: [],

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.fetchData();
      set({ data: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));
```

### Form State Management

```typescript
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;

  setValue: (field: string, value: any) => void;
  setError: (field: string, error: string) => void;
  setTouched: (field: string) => void;
  reset: () => void;
}

const useFormStore = create<FormState>((set) => ({
  values: {},
  errors: {},
  touched: {},

  setValue: (field: string, value: any) =>
    set((state) => ({
      values: { ...state.values, [field]: value },
    })),

  setError: (field: string, error: string) =>
    set((state) => ({
      errors: { ...state.errors, [field]: error },
    })),

  setTouched: (field: string) =>
    set((state) => ({
      touched: { ...state.touched, [field]: true },
    })),

  reset: () => set({ values: {}, errors: {}, touched: {} }),
}));
```

## Next Steps

Now that you understand the fundamentals, you're ready to explore:

1. **Store Creation Patterns** - Advanced store configuration
2. **State Update Strategies** - Complex state mutations
3. **Selectors and Performance** - Optimizing component subscriptions
4. **TypeScript Integration** - Advanced typing patterns

## Practical Example: Truck Store

Here's how our truck tracking application uses Zustand:

```typescript
// Store definition
const useTruckStore = create<TruckStore>((set, get) => ({
  // State
  trucks: [],
  selectedTruckId: null,
  isLoading: false,

  // Actions
  loadTrucks: async () => {
    set({ isLoading: true });
    const trucks = await fetchTrucks();
    set({ trucks, isLoading: false });
  },

  selectTruck: (id: string) => {
    set({ selectedTruckId: id });
  },

  updateTruckPosition: (id: string, position: Position) => {
    set((state) => ({
      trucks: state.trucks.map((truck) =>
        truck.id === id ? { ...truck, currentPosition: position } : truck
      ),
    }));
  },
}));

// Component usage
function TruckList() {
  const { trucks, loadTrucks, selectTruck } = useTruckStore();
  const isLoading = useTruckStore((state) => state.isLoading);

  useEffect(() => {
    loadTrucks();
  }, [loadTrucks]);

  if (isLoading) return <div>Loading trucks...</div>;

  return (
    <div>
      {trucks.map((truck) => (
        <div key={truck.id} onClick={() => selectTruck(truck.id)}>
          {truck.plateNumber} - {truck.status}
        </div>
      ))}
    </div>
  );
}
```

## Key Takeaways

- ✅ Zustand provides a simple, minimal API for state management
- ✅ Stores combine state and actions in a single object
- ✅ State updates must be immutable
- ✅ Selectors allow components to subscribe to specific state slices
- ✅ TypeScript integration is seamless and powerful
- ✅ No providers or complex setup required
- ✅ Perfect for real-world applications like our truck tracker
