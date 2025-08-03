import React, { useEffect, useRef } from "react";
import { useTruckStore } from "../store/truckStore";
import GoogleMapsComponent from "./GoogleMapsComponent";

/**
 * Saudi Arabia Truck Tracking Dashboard - Zustand Learning
 *
 * This component demonstrates:
 * 1. Basic Zustand store usage
 * 2. Loading data with async actions
 * 3. Simple state management
 * 4. Real-world Saudi Arabia locations and routes
 */
const SimpleDashboard: React.FC = () => {
  const { loadTrucks, setLoading, isLoading, error } = useTruckStore();

  // Ref to ensure data loading happens only once
  const hasLoadedData = useRef(false);

  // Load data on application start - simplified for learning
  useEffect(() => {
    if (hasLoadedData.current) return;

    hasLoadedData.current = true;

    const loadData = async () => {
      try {
        console.log("📦 Loading Saudi trucks for Zustand learning...");
        await loadTrucks();
        setLoading(false);
        console.log("✅ Saudi trucks loaded successfully!");
      } catch (error) {
        console.error("❌ Error loading data:", error);
        setLoading(false);
        hasLoadedData.current = false;
      }
    };

    loadData();
  }, [loadTrucks, setLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
              animation: "bounce 1s infinite",
            }}
          >
            🚛
          </div>
          <div style={{ fontWeight: "bold" }}>Loading Saudi trucks...</div>
          <div style={{ fontSize: "14px", marginTop: "10px", opacity: 0.7 }}>
            🇸🇦 Saudi Arabia - Zustand Learning Project
          </div>
        </div>
        <style>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "#d32f2f" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main application - Google Maps with Saudi Arabia
  return <GoogleMapsComponent />;
};

export default SimpleDashboard;
