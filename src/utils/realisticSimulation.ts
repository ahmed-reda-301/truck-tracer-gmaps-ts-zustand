import { Truck, Position } from '../types';

// Saudi Arabia highway routes with realistic waypoints
export const SAUDI_HIGHWAYS = {
  'Highway_40': { // Riyadh to Jeddah
    waypoints: [
      { lat: 24.7136, lng: 46.6753, name: 'Riyadh' },
      { lat: 24.5247, lng: 46.1792, name: 'Al-Kharj' },
      { lat: 24.1333, lng: 45.8000, name: 'Al-Aflaj' },
      { lat: 23.8859, lng: 45.0218, name: 'Al-Sulayyil' },
      { lat: 23.4924, lng: 44.4267, name: 'Wadi al-Dawasir' },
      { lat: 22.7500, lng: 43.1667, name: 'Bishah' },
      { lat: 21.9611, lng: 41.6833, name: 'Taif' },
      { lat: 21.4858, lng: 39.1925, name: 'Jeddah' }
    ],
    speedLimits: [120, 110, 100, 90, 80, 70, 90, 80], // km/h for each segment
    terrainFactors: [1.0, 0.95, 0.9, 0.85, 0.8, 0.7, 0.85, 0.9] // Speed multiplier
  },
  'Highway_50': { // Dammam to Yanbu
    waypoints: [
      { lat: 26.4207, lng: 50.0888, name: 'Dammam' },
      { lat: 25.4295, lng: 49.5906, name: 'Al-Hofuf' },
      { lat: 24.7136, lng: 46.6753, name: 'Riyadh' },
      { lat: 24.4539, lng: 44.9658, name: 'Al-Qassim' },
      { lat: 25.3336, lng: 43.0504, name: 'Hail' },
      { lat: 24.0889, lng: 38.0617, name: 'Yanbu' }
    ],
    speedLimits: [120, 110, 120, 100, 90, 80],
    terrainFactors: [1.0, 0.95, 1.0, 0.9, 0.85, 0.8]
  },
  'Highway_5': { // Jeddah to Al-Khobar
    waypoints: [
      { lat: 21.4858, lng: 39.1925, name: 'Jeddah' },
      { lat: 21.4225, lng: 39.8262, name: 'Mecca' },
      { lat: 21.9611, lng: 41.6833, name: 'Taif' },
      { lat: 24.7136, lng: 46.6753, name: 'Riyadh' },
      { lat: 25.4295, lng: 49.5906, name: 'Al-Hofuf' },
      { lat: 26.2172, lng: 50.1971, name: 'Al-Khobar' }
    ],
    speedLimits: [80, 70, 90, 120, 110, 100],
    terrainFactors: [0.9, 0.7, 0.8, 1.0, 0.95, 1.0]
  },
  'Highway_15': { // North-South routes
    waypoints: [
      { lat: 28.3998, lng: 36.5700, name: 'Tabuk' },
      { lat: 26.3336, lng: 43.0504, name: 'Hail' },
      { lat: 24.7136, lng: 46.6753, name: 'Riyadh' },
      { lat: 22.7500, lng: 43.1667, name: 'Bishah' },
      { lat: 18.2164, lng: 42.5053, name: 'Abha' },
      { lat: 16.9010, lng: 42.5663, name: 'Jazan' }
    ],
    speedLimits: [100, 110, 120, 90, 70, 80],
    terrainFactors: [0.9, 0.95, 1.0, 0.85, 0.6, 0.8]
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate bearing between two points
export const calculateBearing = (pos1: Position, pos2: Position): number => {
  const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
  const lat1 = pos1.lat * Math.PI / 180;
  const lat2 = pos2.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Find nearest highway waypoint
export const findNearestWaypoint = (position: Position, highway: string) => {
  const route = SAUDI_HIGHWAYS[highway as keyof typeof SAUDI_HIGHWAYS];
  if (!route) return null;
  
  let nearestWaypoint = route.waypoints[0];
  let minDistance = calculateDistance(position, nearestWaypoint);
  let waypointIndex = 0;
  
  route.waypoints.forEach((waypoint, index) => {
    const distance = calculateDistance(position, waypoint);
    if (distance < minDistance) {
      minDistance = distance;
      nearestWaypoint = waypoint;
      waypointIndex = index;
    }
  });
  
  return { waypoint: nearestWaypoint, index: waypointIndex, distance: minDistance };
};

// Simulate realistic truck movement
export const simulateRealisticMovement = (truck: Truck): Partial<Truck> => {
  const currentPos = truck.currentPosition;
  const destination = truck.destination;
  
  // Determine which highway the truck is likely on
  let highway = 'Highway_40'; // Default
  if (truck.route.includes('Highway 50')) highway = 'Highway_50';
  else if (truck.route.includes('Highway 5')) highway = 'Highway_5';
  else if (truck.route.includes('Highway 15')) highway = 'Highway_15';
  
  const route = SAUDI_HIGHWAYS[highway as keyof typeof SAUDI_HIGHWAYS];
  const nearestWaypoint = findNearestWaypoint(currentPos, highway);
  
  if (!nearestWaypoint || !route) {
    // Fallback to simple linear movement
    const bearing = calculateBearing(currentPos, destination);
    const distance = calculateDistance(currentPos, destination);
    
    if (distance < 1) { // Less than 1km, mark as completed
      return {
        status: 'completed',
        speed: 0,
        currentPosition: destination
      };
    }
    
    // Move 1-3 km towards destination
    const moveDistance = Math.random() * 2 + 1; // 1-3 km
    const moveRatio = moveDistance / distance;
    
    const newLat = currentPos.lat + (destination.lat - currentPos.lat) * moveRatio;
    const newLng = currentPos.lng + (destination.lng - currentPos.lng) * moveRatio;
    
    return {
      currentPosition: { lat: newLat, lng: newLng, timestamp: new Date().toISOString() },
      heading: bearing,
      speed: Math.min(truck.speed + (Math.random() - 0.5) * 10, 120)
    };
  }
  
  // Realistic highway-based movement
  const waypointIndex = nearestWaypoint.index;
  const nextWaypointIndex = Math.min(waypointIndex + 1, route.waypoints.length - 1);
  const nextWaypoint = route.waypoints[nextWaypointIndex];
  
  const bearing = calculateBearing(currentPos, nextWaypoint);
  const speedLimit = route.speedLimits[waypointIndex] || 100;
  const terrainFactor = route.terrainFactors[waypointIndex] || 1.0;
  
  // Calculate realistic speed based on conditions
  let targetSpeed = speedLimit * terrainFactor;
  
  // Add some randomness for traffic conditions
  const trafficFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  targetSpeed *= trafficFactor;
  
  // Gradually adjust speed towards target
  const currentSpeed = truck.speed;
  const speedDiff = targetSpeed - currentSpeed;
  const newSpeed = Math.max(30, Math.min(120, currentSpeed + speedDiff * 0.1));
  
  // Move towards next waypoint
  const distanceToWaypoint = calculateDistance(currentPos, nextWaypoint);
  const moveDistance = (newSpeed / 60) * 2; // Distance in 2 minutes at current speed
  
  if (distanceToWaypoint < moveDistance) {
    // Close to waypoint, move to it
    return {
      currentPosition: { 
        lat: nextWaypoint.lat, 
        lng: nextWaypoint.lng, 
        timestamp: new Date().toISOString() 
      },
      heading: bearing,
      speed: newSpeed
    };
  } else {
    // Move towards waypoint
    const moveRatio = moveDistance / distanceToWaypoint;
    const newLat = currentPos.lat + (nextWaypoint.lat - currentPos.lat) * moveRatio;
    const newLng = currentPos.lng + (nextWaypoint.lng - currentPos.lng) * moveRatio;
    
    return {
      currentPosition: { lat: newLat, lng: newLng, timestamp: new Date().toISOString() },
      heading: bearing,
      speed: newSpeed
    };
  }
};

// Generate random events (like FlightRadar24)
export const generateRandomEvent = (truck: Truck): any[] => {
  const events = [];
  const random = Math.random();
  
  if (random < 0.05) { // 5% chance of speed alert
    events.push({
      id: `alert-${Date.now()}`,
      truckId: truck.id,
      truckPlateNumber: truck.plateNumber,
      truckDriverName: truck.driverName,
      type: 'speed',
      message: `Speed: ${Math.round(truck.speed)} km/h on ${truck.route.split(' - ')[0]}`,
      severity: truck.speed > 100 ? 'warning' : 'info',
      timestamp: new Date().toISOString()
    });
  }
  
  if (random < 0.02) { // 2% chance of fuel alert
    events.push({
      id: `alert-${Date.now()}`,
      truckId: truck.id,
      truckPlateNumber: truck.plateNumber,
      truckDriverName: truck.driverName,
      type: 'fuel',
      message: `Fuel level: ${truck.fuel}% - Consider refueling`,
      severity: truck.fuel < 30 ? 'warning' : 'info',
      timestamp: new Date().toISOString()
    });
  }
  
  return events;
};
