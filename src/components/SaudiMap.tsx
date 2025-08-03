import React, { useState } from "react";
import { useTruckStore } from "../store/truckStore";
import { Truck } from "../types";

/**
 * Saudi Arabia Map Component for Zustand Learning
 * 
 * Features:
 * 1. Real Saudi Arabia map with actual cities
 * 2. Display truck icons on real locations
 * 3. Click truck to show route and info
 * 4. Filter trucks visibility
 * 5. Realistic routes between Saudi cities
 */

// Saudi Arabia major cities coordinates
const SAUDI_CITIES = {
  riyadh: { lat: 24.7136, lng: 46.6753, name: "Riyadh" },
  jeddah: { lat: 21.4858, lng: 39.1925, name: "Jeddah" },
  mecca: { lat: 21.3891, lng: 39.8579, name: "Mecca" },
  medina: { lat: 24.5247, lng: 39.5692, name: "Medina" },
  dammam: { lat: 26.4207, lng: 50.0888, name: "Dammam" },
  khobar: { lat: 26.2172, lng: 50.1971, name: "Al-Khobar" },
  tabuk: { lat: 28.3998, lng: 36.5700, name: "Tabuk" },
  abha: { lat: 18.2465, lng: 42.6026, name: "Abha" },
  jazan: { lat: 16.9004, lng: 42.5531, name: "Jazan" },
  hafrAlBatin: { lat: 28.4327, lng: 45.9700, name: "Hafr Al-Batin" },
  buraidah: { lat: 26.3260, lng: 43.9750, name: "Buraidah" },
  taif: { lat: 21.2703, lng: 40.4178, name: "Taif" }
};

// Map bounds for Saudi Arabia
const SAUDI_BOUNDS = {
  north: 32.5,
  south: 16.0,
  east: 55.0,
  west: 34.0
};

const SaudiMap: React.FC = () => {
  const { trucks, selectTruck } = useTruckStore();
  const [showTrucks, setShowTrucks] = useState(true);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);

  // Convert lat/lng to screen coordinates
  const latLngToScreen = (lat: number, lng: number) => {
    const x = ((lng - SAUDI_BOUNDS.west) / (SAUDI_BOUNDS.east - SAUDI_BOUNDS.west)) * window.innerWidth;
    const y = ((SAUDI_BOUNDS.north - lat) / (SAUDI_BOUNDS.north - SAUDI_BOUNDS.south)) * window.innerHeight;
    return { x, y };
  };

  // Handle truck click
  const handleTruckClick = (truck: Truck) => {
    setSelectedTruckId(truck.id);
    selectTruck(truck.id);
  };

  // Get truck icon based on status
  const getTruckIcon = (status: string) => {
    const icons = {
      moving: "🚛",
      stopped: "🚚",
      completed: "✅",
      delayed: "⚠️",
      maintenance: "🔧",
    };
    return icons[status as keyof typeof icons] || "🚛";
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      moving: "#4CAF50",
      stopped: "#FF9800", 
      completed: "#2196F3",
      delayed: "#F44336",
      maintenance: "#9C27B0",
    };
    return colors[status as keyof typeof colors] || "#4CAF50";
  };

  return (
    <div style={{ 
      width: "100vw", 
      height: "100vh", 
      position: "relative",
      background: `
        linear-gradient(135deg, 
          #f4e4bc 0%,
          #e8d5a3 25%, 
          #dcc68a 50%,
          #d0b771 75%,
          #c4a858 100%
        )
      `,
      overflow: "hidden"
    }}>
      {/* Learning Header */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(76, 175, 80, 0.95)",
        color: "white",
        padding: "12px 24px",
        borderRadius: "25px",
        fontSize: "16px",
        fontWeight: "bold",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        border: "2px solid #388E3C"
      }}>
        🇸🇦 Saudi Arabia Truck Tracking - Zustand Learning
      </div>

      {/* Filter Controls */}
      <div style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        background: "rgba(255, 255, 255, 0.95)",
        padding: "15px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 1000,
        border: "1px solid #ddd"
      }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showTrucks}
            onChange={(e) => setShowTrucks(e.target.checked)}
            style={{ transform: "scale(1.3)" }}
          />
          <span style={{ fontWeight: "600", fontSize: "14px" }}>
            Show Trucks ({trucks.length})
          </span>
        </label>
      </div>

      {/* Saudi Arabia Map Background */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        height: "70%",
        background: `
          radial-gradient(ellipse at center, 
            rgba(139, 69, 19, 0.1) 0%,
            rgba(160, 82, 45, 0.2) 50%,
            rgba(139, 69, 19, 0.3) 100%
          )
        `,
        borderRadius: "20px",
        border: "3px solid rgba(139, 69, 19, 0.4)"
      }} />

      {/* Major Cities */}
      {Object.entries(SAUDI_CITIES).map(([key, city]) => {
        const { x, y } = latLngToScreen(city.lat, city.lng);
        return (
          <div key={key} style={{
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 50
          }}>
            {/* City Marker */}
            <div style={{
              width: "8px",
              height: "8px",
              background: "#8B4513",
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }} />
            {/* City Name */}
            <div style={{
              position: "absolute",
              top: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "11px",
              fontWeight: "bold",
              color: "#5D4037",
              textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
              whiteSpace: "nowrap"
            }}>
              {city.name}
            </div>
          </div>
        );
      })}

      {/* Trucks */}
      {showTrucks && trucks.map((truck) => {
        const { x, y } = latLngToScreen(truck.currentPosition.lat, truck.currentPosition.lng);
        const isSelected = selectedTruckId === truck.id;

        return (
          <div key={truck.id}>
            {/* Truck Icon */}
            <div
              onClick={() => handleTruckClick(truck)}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
                fontSize: isSelected ? "36px" : "28px",
                cursor: "pointer",
                zIndex: isSelected ? 1000 : 200,
                transition: "all 0.3s ease",
                filter: isSelected ? 
                  "drop-shadow(0 0 15px rgba(76, 175, 80, 0.9))" : 
                  "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                animation: truck.status === "moving" ? "truckMove 3s infinite" : "none"
              }}
              title={`${truck.plateNumber} - ${truck.status}`}
            >
              {getTruckIcon(truck.status)}
            </div>

            {/* Truck Info (when selected) */}
            {isSelected && (
              <div style={{
                position: "absolute",
                left: `${x + 40}px`,
                top: `${y - 60}px`,
                background: "rgba(255, 255, 255, 0.98)",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                fontSize: "13px",
                minWidth: "250px",
                zIndex: 1001,
                border: `3px solid ${getStatusColor(truck.status)}`,
                fontFamily: "Arial, sans-serif"
              }}>
                <div style={{ 
                  fontWeight: "bold", 
                  marginBottom: "12px", 
                  color: getStatusColor(truck.status),
                  fontSize: "15px",
                  borderBottom: `2px solid ${getStatusColor(truck.status)}`,
                  paddingBottom: "8px"
                }}>
                  🚛 {truck.plateNumber}
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Driver:</strong> {truck.driverName}
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Company:</strong> {truck.company}
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Status:</strong> 
                  <span style={{ 
                    color: getStatusColor(truck.status),
                    fontWeight: "bold",
                    marginLeft: "5px"
                  }}>
                    {truck.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Speed:</strong> {truck.speed} km/h
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>From:</strong> {truck.origin.name}
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>To:</strong> {truck.destination.name}
                </div>
                {truck.alerts.length > 0 && (
                  <div style={{ 
                    marginTop: "12px", 
                    padding: "8px",
                    background: "#ffebee",
                    borderRadius: "6px",
                    border: "1px solid #ffcdd2"
                  }}>
                    <div style={{ color: "#d32f2f", fontWeight: "bold", fontSize: "12px" }}>
                      ⚠️ {truck.alerts.length} Alert{truck.alerts.length > 1 ? 's' : ''}
                    </div>
                    {truck.alerts.map((alert, index) => (
                      <div key={index} style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Route Line (when selected) */}
            {isSelected && (
              <>
                {/* Origin to Current Position (completed route) */}
                <svg style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 100
                }}>
                  <line
                    x1={latLngToScreen(truck.origin.lat, truck.origin.lng).x}
                    y1={latLngToScreen(truck.origin.lat, truck.origin.lng).y}
                    x2={x}
                    y2={y}
                    stroke="#4CAF50"
                    strokeWidth="4"
                    strokeDasharray="none"
                    opacity="0.8"
                  />
                </svg>

                {/* Current Position to Destination (remaining route) */}
                <svg style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 100
                }}>
                  <line
                    x1={x}
                    y1={y}
                    x2={latLngToScreen(truck.destination.lat, truck.destination.lng).x}
                    y2={latLngToScreen(truck.destination.lat, truck.destination.lng).y}
                    stroke="#FF9800"
                    strokeWidth="4"
                    strokeDasharray="15,10"
                    opacity="0.8"
                  />
                </svg>

                {/* Origin Marker */}
                <div style={{
                  position: "absolute",
                  left: `${latLngToScreen(truck.origin.lat, truck.origin.lng).x}px`,
                  top: `${latLngToScreen(truck.origin.lat, truck.origin.lng).y}px`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "24px",
                  zIndex: 300,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                }}>
                  🏁
                </div>

                {/* Destination Marker */}
                <div style={{
                  position: "absolute",
                  left: `${latLngToScreen(truck.destination.lat, truck.destination.lng).x}px`,
                  top: `${latLngToScreen(truck.destination.lat, truck.destination.lng).y}px`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "24px",
                  zIndex: 300,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                }}>
                  🎯
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Instructions */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        background: "rgba(255, 255, 255, 0.95)",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        fontSize: "14px",
        maxWidth: "320px",
        border: "1px solid #ddd"
      }}>
        <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#2E7D32" }}>
          📖 Instructions:
        </div>
        <div style={{ marginBottom: "6px" }}>• Click on any truck to see its route and information</div>
        <div style={{ marginBottom: "6px" }}>• Green line: completed route</div>
        <div style={{ marginBottom: "6px" }}>• Orange dashed line: remaining route</div>
        <div style={{ marginBottom: "6px" }}>• Use the filter to hide/show trucks</div>
        <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
          Real Saudi Arabia locations and routes
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes truckMove {
          0% { transform: translate(-50%, -50%) scale(1); }
          25% { transform: translate(-50%, -50%) scale(1.1) rotate(2deg); }
          50% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          75% { transform: translate(-50%, -50%) scale(1.1) rotate(-2deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default SaudiMap;
