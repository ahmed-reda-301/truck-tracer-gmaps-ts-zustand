import React, { useEffect, useRef, useState } from "react";
import { useTruckStore } from "../store/truckStore";
import { Truck, EntryPoint } from "../types";
import EntryPointsLayer from "./EntryPointsLayer";

// Import entry points data
import entryPointsData from "../data/saudi_entry_points.json";

// Google Maps API Key - Add your key here
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

// Saudi Arabia center coordinates
const SAUDI_CENTER = { lat: 24.7136, lng: 46.6753 };

interface GoogleMapsComponentProps {
  onMapLoad?: (map: google.maps.Map) => void;
}

const GoogleMapsComponent: React.FC<GoogleMapsComponentProps> = ({
  onMapLoad,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = useRef<Map<string, google.maps.Polyline[]>>(new Map());

  const { trucks, selectTruck } = useTruckStore();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showTrucks, setShowTrucks] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showRoutes, setShowRoutes] = useState(false);
  const [showOnlyWithAlerts, setShowOnlyWithAlerts] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState(true);

  // Entry points visibility
  const [showPorts, setShowPorts] = useState(true);
  const [showAirports, setShowAirports] = useState(true);
  const [showBorders, setShowBorders] = useState(true);

  // Entry points data
  const allEntryPoints: EntryPoint[] = [
    ...entryPointsData.ports,
    ...entryPointsData.airports,
    ...entryPointsData.borderCrossings,
  ] as EntryPoint[];

  // Load Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn(
        "Google Maps API key not found. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file"
      );
      return;
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: SAUDI_CENTER,
        zoom: 6,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f4e4bc" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#8B4513" }, { weight: 2 }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#4A90E2" }],
          },
        ],
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      // Add map click listener to clear selection
      map.addListener("click", () => {
        clearAllRoutes();
        setSelectedTruckId(null);
        selectTruck(null);
      });

      mapInstanceRef.current = map;
      setIsMapLoaded(true);

      if (onMapLoad) {
        onMapLoad(map);
      }
    };

    loadGoogleMaps();
  }, [onMapLoad]);

  // Realistic truck movement simulation (like FlightRadar24)
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      const { updateAllMovingTrucks } = useTruckStore.getState();

      // Update all moving trucks with realistic simulation
      updateAllMovingTrucks();
    }, 3000); // Update every 3 seconds for more realistic movement

    return () => clearInterval(interval);
  }, [simulationActive]);

  // Get unique origins and destinations for filters
  const getUniqueOrigins = () => {
    const origins = [
      ...new Set(trucks.map((truck) => truck.origin.id).filter(Boolean)),
    ];
    return origins
      .map((id) => allEntryPoints.find((ep) => ep.id === id))
      .filter(Boolean) as EntryPoint[];
  };

  const getUniqueDestinations = () => {
    const destinations = [
      ...new Set(trucks.map((truck) => truck.destination.id).filter(Boolean)),
    ];
    return destinations
      .map((id) => allEntryPoints.find((ep) => ep.id === id))
      .filter(Boolean) as EntryPoint[];
  };

  // Update truck markers
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and polylines
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    polylinesRef.current.forEach((polylines) => {
      polylines.forEach((polyline) => polyline.setMap(null));
    });
    polylinesRef.current.clear();

    // Advanced filtering logic
    const filteredTrucks = trucks.filter((truck) => {
      if (!showTrucks) return false;

      // Status filter
      if (statusFilter !== "all" && truck.status !== statusFilter) return false;

      // Company filter
      if (companyFilter !== "all" && truck.company !== companyFilter)
        return false;

      // Origin filter
      if (originFilter !== "all" && truck.origin.id !== originFilter)
        return false;

      // Destination filter
      if (
        destinationFilter !== "all" &&
        truck.destination.id !== destinationFilter
      )
        return false;

      // Alerts filter
      if (showOnlyWithAlerts && truck.alerts.length === 0) return false;

      return true;
    });

    // Add markers for filtered trucks
    filteredTrucks.forEach((truck) => {
      const position = {
        lat: truck.currentPosition.lat,
        lng: truck.currentPosition.lng,
      };

      // Highlight selected truck
      const isSelected = selectedTruckId === truck.id;

      // Create custom marker with truck icon
      const marker = new google.maps.Marker({
        position,
        map,
        title: `${truck.plateNumber} - ${truck.status}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            createTruckSVG(truck, isSelected)
          )}`,
          scaledSize: new google.maps.Size(
            isSelected ? 60 : 50,
            isSelected ? 60 : 50
          ),
          anchor: new google.maps.Point(
            isSelected ? 30 : 25,
            isSelected ? 30 : 25
          ),
        },
        animation:
          truck.status === "moving" ? google.maps.Animation.BOUNCE : undefined,
        zIndex: isSelected ? 1000 : 1,
      });

      // Add click listener
      marker.addListener("click", (e: any) => {
        e.stop(); // Prevent map click event

        // Clear previous routes
        clearAllRoutes();

        // Set selected truck
        setSelectedTruckId(truck.id);
        selectTruck(truck.id);

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(truck),
        });

        infoWindow.open(map, marker);

        // Show route for selected truck only
        showTruckRoute(truck, map);
      });

      markersRef.current.set(truck.id, marker);
    });
  }, [
    trucks,
    isMapLoaded,
    showTrucks,
    statusFilter,
    companyFilter,
    originFilter,
    destinationFilter,
    showOnlyWithAlerts,
    selectedTruckId,
    selectTruck,
  ]);

  // Create enhanced SVG icon for truck with better design
  const createTruckSVG = (truck: Truck, isSelected: boolean = false) => {
    const colors = {
      moving: "#4CAF50",
      stopped: "#FF9800",
      completed: "#2196F3",
      delayed: "#F44336",
      maintenance: "#9C27B0",
    };

    const color = colors[truck.status as keyof typeof colors] || "#4CAF50";
    const rotation = truck.heading || 0;
    const isMoving = truck.status === "moving";

    return `
      <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>

        ${
          isSelected
            ? `
          <circle cx="25" cy="25" r="24" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.8">
            <animate attributeName="r" values="20;28;20" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
        `
            : ""
        }

        <g transform="rotate(${rotation} 25 25)" filter="url(#shadow)">
          <!-- Truck shadow/base -->
          <ellipse cx="25" cy="42" rx="20" ry="4" fill="rgba(0,0,0,0.2)"/>

          <!-- Main truck body -->
          <rect x="10" y="15" width="30" height="15" fill="${color}" stroke="white" stroke-width="2" rx="3"/>

          <!-- Truck cab -->
          <rect x="10" y="8" width="12" height="12" fill="${color}" stroke="white" stroke-width="2" rx="2"/>

          <!-- Windshield -->
          <rect x="12" y="10" width="8" height="6" fill="rgba(135,206,235,0.8)" stroke="white" stroke-width="1" rx="1"/>

          <!-- Wheels -->
          <circle cx="15" cy="32" r="4" fill="#333" stroke="white" stroke-width="2"/>
          <circle cx="15" cy="32" r="2" fill="#666"/>
          <circle cx="35" cy="32" r="4" fill="#333" stroke="white" stroke-width="2"/>
          <circle cx="35" cy="32" r="2" fill="#666"/>

          <!-- Direction arrow -->
          <polygon points="40,18 45,22 40,26" fill="white" stroke="${color}" stroke-width="1"/>

          <!-- Company logo area -->
          <rect x="25" y="17" width="12" height="8" fill="rgba(255,255,255,0.9)" stroke="${color}" stroke-width="1" rx="1"/>
          <text x="31" y="23" text-anchor="middle" fill="${color}" font-size="6" font-weight="bold">🚛</text>

          <!-- Speed indicator for moving trucks -->
          ${
            isMoving
              ? `
            <g opacity="0.7">
              <line x1="5" y1="20" x2="8" y2="20" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <line x1="4" y1="23" x2="7" y2="23" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <line x1="5" y1="26" x2="8" y2="26" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </g>
          `
              : ""
          }
        </g>

        <!-- Alert indicator -->
        ${
          truck.alerts.length > 0
            ? `
          <g>
            <circle cx="42" cy="8" r="6" fill="#F44336" stroke="white" stroke-width="2"/>
            <text x="42" y="12" text-anchor="middle" fill="white" font-size="10" font-weight="bold">!</text>
          </g>
        `
            : ""
        }

        <!-- Status indicator -->
        <circle cx="8" cy="8" r="5" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="8" y="12" text-anchor="middle" fill="white" font-size="8">${
          truck.status === "moving"
            ? "▶"
            : truck.status === "stopped"
            ? "⏸"
            : truck.status === "completed"
            ? "✓"
            : truck.status === "delayed"
            ? "⚠"
            : "🔧"
        }</text>
      </svg>
    `;
  };

  // Create info window content
  const createInfoWindowContent = (truck: Truck) => {
    return `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #2E7D32;">${
          truck.plateNumber
        }</h3>
        <p><strong>Driver:</strong> ${truck.driverName}</p>
        <p><strong>Company:</strong> ${truck.company}</p>
        <p><strong>Status:</strong> <span style="color: ${getStatusColor(
          truck.status
        )}; font-weight: bold;">${truck.status.toUpperCase()}</span></p>
        <p><strong>Speed:</strong> ${truck.speed} km/h</p>
        <p><strong>From:</strong> ${truck.origin.name}</p>
        <p><strong>To:</strong> ${truck.destination.name}</p>
        ${
          truck.alerts.length > 0
            ? `
          <div style="margin-top: 10px; padding: 8px; background: #ffebee; border-radius: 4px;">
            <strong style="color: #d32f2f;">⚠️ ${truck.alerts.length} Alert${
                truck.alerts.length > 1 ? "s" : ""
              }</strong>
            ${truck.alerts
              .map(
                (alert) =>
                  `<div style="font-size: 12px; color: #666; margin-top: 4px;">${alert.message}</div>`
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;
  };

  // Show truck route
  const showTruckRoute = (truck: Truck, map: google.maps.Map) => {
    // Clear existing polylines for this truck
    const existingPolylines = polylinesRef.current.get(truck.id) || [];
    existingPolylines.forEach((polyline) => polyline.setMap(null));

    const polylines: google.maps.Polyline[] = [];

    // Completed route (origin to current position)
    const completedRoute = new google.maps.Polyline({
      path: [
        { lat: truck.origin.lat, lng: truck.origin.lng },
        { lat: truck.currentPosition.lat, lng: truck.currentPosition.lng },
      ],
      geodesic: true,
      strokeColor: "#4CAF50",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map,
    });
    polylines.push(completedRoute);

    // Remaining route (current position to destination)
    const remainingRoute = new google.maps.Polyline({
      path: [
        { lat: truck.currentPosition.lat, lng: truck.currentPosition.lng },
        { lat: truck.destination.lat, lng: truck.destination.lng },
      ],
      geodesic: true,
      strokeColor: "#FF9800",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 1,
            scale: 4,
          },
          offset: "0",
          repeat: "20px",
        },
      ],
      map,
    });
    polylines.push(remainingRoute);

    // Add origin and destination markers
    const originMarker = new google.maps.Marker({
      position: { lat: truck.origin.lat, lng: truck.origin.lng },
      map,
      title: `Origin: ${truck.origin.name}`,
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#4CAF50" stroke="white" stroke-width="2"/>
            <text x="15" y="20" text-anchor="middle" fill="white" font-size="16">🏁</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15),
      },
    });

    const destinationMarker = new google.maps.Marker({
      position: { lat: truck.destination.lat, lng: truck.destination.lng },
      map,
      title: `Destination: ${truck.destination.name}`,
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#FF9800" stroke="white" stroke-width="2"/>
            <text x="15" y="20" text-anchor="middle" fill="white" font-size="16">🎯</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15),
      },
    });

    polylines.push(originMarker as any);
    polylines.push(destinationMarker as any);

    polylinesRef.current.set(truck.id, polylines);
  };

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

  const getUniqueStatuses = () => {
    const statuses = [...new Set(trucks.map((truck) => truck.status))];
    return statuses;
  };

  const getUniqueCompanies = () => {
    const companies = [...new Set(trucks.map((truck) => truck.company))];
    return companies;
  };

  // Clear all routes function
  const clearAllRoutes = () => {
    polylinesRef.current.forEach((polylines) => {
      polylines.forEach((polyline) => polyline.setMap(null));
    });
    polylinesRef.current.clear();
  };

  // Get filtered trucks for display count
  const filteredTrucksCount = trucks.filter((truck) => {
    if (!showTrucks) return false;
    if (statusFilter !== "all" && truck.status !== statusFilter) return false;
    if (companyFilter !== "all" && truck.company !== companyFilter)
      return false;
    if (showOnlyWithAlerts && truck.alerts.length === 0) return false;
    return true;
  });

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
          flexDirection: "column",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🗺️</div>
        <h2 style={{ color: "#d32f2f", marginBottom: "16px" }}>
          Google Maps API Key Required
        </h2>
        <p style={{ color: "#666", maxWidth: "500px", lineHeight: "1.6" }}>
          To use Google Maps, please add your API key to the <code>.env</code>{" "}
          file:
        </p>
        <div
          style={{
            background: "#f5f5f5",
            padding: "12px",
            borderRadius: "8px",
            fontFamily: "monospace",
            margin: "16px 0",
            border: "1px solid #ddd",
          }}
        >
          REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
        </div>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Get your API key from{" "}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Cloud Console
          </a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Learning Header */}
      <div
        style={{
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
          border: "2px solid #388E3C",
        }}
      >
        🇸🇦 Saudi Arabia Truck Tracking - Zustand Learning
      </div>

      {/* Advanced Filters */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 1000,
          border: "1px solid #ddd",
          minWidth: "250px",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "12px",
            color: "#2E7D32",
            fontSize: "16px",
          }}
        >
          🎛️ Advanced Filters
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showTrucks}
              onChange={(e) => setShowTrucks(e.target.checked)}
              style={{ transform: "scale(1.3)" }}
            />
            <span style={{ fontWeight: "600", fontSize: "14px" }}>
              Show Trucks ({filteredTrucksCount.length})
            </span>
          </label>
        </div>

        <div>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "6px",
              display: "block",
            }}
          >
            Filter by Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "13px",
            }}
          >
            <option value="all">All Statuses</option>
            {getUniqueStatuses().map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)} (
                {trucks.filter((t) => t.status === status).length})
              </option>
            ))}
          </select>
        </div>

        {/* Company Filter */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "6px",
              display: "block",
            }}
          >
            Filter by Company:
          </label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "13px",
            }}
          >
            <option value="all">All Companies</option>
            {getUniqueCompanies().map((company) => (
              <option key={company} value={company}>
                {company} ({trucks.filter((t) => t.company === company).length})
              </option>
            ))}
          </select>
        </div>

        {/* Alerts Filter */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showOnlyWithAlerts}
              onChange={(e) => setShowOnlyWithAlerts(e.target.checked)}
              style={{ transform: "scale(1.2)" }}
            />
            <span style={{ fontSize: "13px", color: "#d32f2f" }}>
              ⚠️ Only trucks with alerts (
              {trucks.filter((t) => t.alerts.length > 0).length})
            </span>
          </label>
        </div>

        {/* Routes Toggle */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              style={{ transform: "scale(1.2)" }}
            />
            <span style={{ fontSize: "13px", color: "#1976d2" }}>
              🛣️ Show all routes
            </span>
          </label>
        </div>

        {/* Origin Filter */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "6px",
              display: "block",
            }}
          >
            Filter by Origin:
          </label>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "13px",
            }}
          >
            <option value="all">All Origins</option>
            {getUniqueOrigins().map((origin) => (
              <option key={origin.id} value={origin.id}>
                {origin.name}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Filter */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "6px",
              display: "block",
            }}
          >
            Filter by Destination:
          </label>
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "13px",
            }}
          >
            <option value="all">All Destinations</option>
            {getUniqueDestinations().map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
        </div>

        {/* Entry Points Visibility */}
        <div
          style={{
            marginBottom: "12px",
            padding: "8px",
            background: "#f8f9fa",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              marginBottom: "8px",
              color: "#333",
              fontSize: "12px",
            }}
          >
            🏢 Entry Points Visibility:
          </div>

          <div style={{ marginBottom: "6px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showPorts}
                onChange={(e) => setShowPorts(e.target.checked)}
                style={{ transform: "scale(1.1)" }}
              />
              <span style={{ fontSize: "12px", color: "#1976D2" }}>
                ⚓ Seaports
              </span>
            </label>
          </div>

          <div style={{ marginBottom: "6px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showAirports}
                onChange={(e) => setShowAirports(e.target.checked)}
                style={{ transform: "scale(1.1)" }}
              />
              <span style={{ fontSize: "12px", color: "#FF9800" }}>
                ✈️ Airports
              </span>
            </label>
          </div>

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showBorders}
                onChange={(e) => setShowBorders(e.target.checked)}
                style={{ transform: "scale(1.1)" }}
              />
              <span style={{ fontSize: "12px", color: "#4CAF50" }}>
                🚪 Border Crossings
              </span>
            </label>
          </div>
        </div>

        {/* Simulation Control */}
        <div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={simulationActive}
              onChange={(e) => setSimulationActive(e.target.checked)}
              style={{ transform: "scale(1.2)" }}
            />
            <span style={{ fontSize: "13px", color: "#4CAF50" }}>
              🎬 Live simulation {simulationActive ? "(Active)" : "(Paused)"}
            </span>
          </label>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Entry Points Layer */}
      {isMapLoaded && mapInstanceRef.current && (
        <EntryPointsLayer
          map={mapInstanceRef.current}
          entryPoints={allEntryPoints}
          showPorts={showPorts}
          showAirports={showAirports}
          showBorders={showBorders}
          onEntryPointClick={(entryPoint) => {
            console.log("Entry point clicked:", entryPoint);
          }}
        />
      )}

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          fontSize: "14px",
          maxWidth: "320px",
          border: "1px solid #ddd",
        }}
      >
        <div
          style={{ fontWeight: "bold", marginBottom: "10px", color: "#2E7D32" }}
        >
          📖 Interactive Instructions:
        </div>
        <div style={{ marginBottom: "6px" }}>
          • Click truck: show route & details
        </div>
        <div style={{ marginBottom: "6px" }}>• Click map: clear all routes</div>
        <div style={{ marginBottom: "6px" }}>• Green line: completed route</div>
        <div style={{ marginBottom: "6px" }}>
          • Orange dashed: remaining route
        </div>
        <div style={{ marginBottom: "6px" }}>
          • 🎬 Realistic simulation: like FlightRadar24
        </div>
        <div style={{ marginBottom: "6px" }}>
          • Truck icons rotate with highway direction
        </div>
        <div style={{ marginBottom: "6px" }}>
          • Real Saudi highways & traffic conditions
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
          Real-time Google Maps with Saudi Arabia
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsComponent;
