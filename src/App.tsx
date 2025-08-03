import React from "react";
import SimpleDashboard from "./components/SimpleDashboard";
import "./App.css";

/**
 * Main App Component for Zustand Learning Project
 *
 * This is a simplified truck tracking application focused on
 * learning Zustand state management concepts.
 */
function App() {
  return (
    <div className="App">
      <SimpleDashboard />
    </div>
  );
}

export default App;
