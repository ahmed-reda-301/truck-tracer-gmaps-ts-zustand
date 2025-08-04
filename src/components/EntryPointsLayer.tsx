import React from 'react';
import { EntryPoint } from '../types';

interface EntryPointsLayerProps {
  map: google.maps.Map;
  entryPoints: EntryPoint[];
  showPorts: boolean;
  showAirports: boolean;
  showBorders: boolean;
  onEntryPointClick?: (entryPoint: EntryPoint) => void;
}

const EntryPointsLayer: React.FC<EntryPointsLayerProps> = ({
  map,
  entryPoints,
  showPorts,
  showAirports,
  showBorders,
  onEntryPointClick
}) => {
  const [markers, setMarkers] = React.useState<google.maps.Marker[]>([]);

  // Create SVG icons for different entry point types
  const createEntryPointSVG = (entryPoint: EntryPoint) => {
    const colors = {
      seaport: '#1976D2',
      airport: '#FF9800', 
      border: '#4CAF50'
    };

    const icons = {
      seaport: '⚓',
      airport: '✈️',
      border: '🚪'
    };

    const color = colors[entryPoint.type];
    const icon = icons[entryPoint.type];

    return `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        
        <!-- Background circle -->
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
        
        <!-- Icon -->
        <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${icon}</text>
        
        <!-- Status indicator -->
        <circle cx="32" cy="8" r="4" fill="${entryPoint.isActive ? '#4CAF50' : '#F44336'}" stroke="white" stroke-width="1"/>
        
        <!-- Capacity indicator -->
        ${entryPoint.capacity === 'Very High' ? `
          <rect x="6" y="32" width="28" height="4" fill="rgba(255,255,255,0.8)" rx="2"/>
          <rect x="6" y="32" width="28" height="4" fill="${color}" rx="2"/>
        ` : entryPoint.capacity === 'High' ? `
          <rect x="6" y="32" width="28" height="4" fill="rgba(255,255,255,0.8)" rx="2"/>
          <rect x="6" y="32" width="21" height="4" fill="${color}" rx="2"/>
        ` : `
          <rect x="6" y="32" width="28" height="4" fill="rgba(255,255,255,0.8)" rx="2"/>
          <rect x="6" y="32" width="14" height="4" fill="${color}" rx="2"/>
        `}
      </svg>
    `;
  };

  // Create info window content
  const createInfoWindowContent = (entryPoint: EntryPoint) => {
    const typeNames = {
      seaport: 'ميناء بحري',
      airport: 'مطار',
      border: 'منفذ حدودي'
    };

    return `
      <div style="max-width: 300px; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #1976D2, #42A5F5); color: white; padding: 12px; margin: -8px -8px 12px -8px; border-radius: 8px 8px 0 0;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${entryPoint.name}</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">${entryPoint.nameEn}</p>
        </div>
        
        <div style="padding: 0 4px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="background: ${entryPoint.type === 'seaport' ? '#1976D2' : entryPoint.type === 'airport' ? '#FF9800' : '#4CAF50'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; margin-right: 8px;">
              ${typeNames[entryPoint.type]}
            </span>
            <span style="background: ${entryPoint.isActive ? '#4CAF50' : '#F44336'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">
              ${entryPoint.isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>
          
          ${entryPoint.capacity ? `
            <div style="margin-bottom: 8px;">
              <strong style="color: #333;">السعة:</strong> ${entryPoint.capacity}
            </div>
          ` : ''}
          
          ${entryPoint.operatingHours ? `
            <div style="margin-bottom: 8px;">
              <strong style="color: #333;">ساعات العمل:</strong> ${entryPoint.operatingHours}
            </div>
          ` : ''}
          
          ${entryPoint.services && entryPoint.services.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <strong style="color: #333;">الخدمات:</strong><br>
              ${entryPoint.services.map(service => `<span style="background: #f5f5f5; padding: 2px 6px; border-radius: 8px; font-size: 11px; margin: 2px 2px 2px 0; display: inline-block;">${service}</span>`).join('')}
            </div>
          ` : ''}
          
          ${entryPoint.borderWith ? `
            <div style="margin-bottom: 8px;">
              <strong style="color: #333;">الحدود مع:</strong> ${entryPoint.borderWith}
            </div>
          ` : ''}
          
          ${entryPoint.iataCode ? `
            <div style="margin-bottom: 8px;">
              <strong style="color: #333;">رمز IATA:</strong> ${entryPoint.iataCode}
            </div>
          ` : ''}
          
          ${entryPoint.authority ? `
            <div style="color: #666; font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              ${entryPoint.authority}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  React.useEffect(() => {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Filter entry points based on visibility settings
    const visibleEntryPoints = entryPoints.filter(entryPoint => {
      if (entryPoint.type === 'seaport' && !showPorts) return false;
      if (entryPoint.type === 'airport' && !showAirports) return false;
      if (entryPoint.type === 'border' && !showBorders) return false;
      return true;
    });

    // Create new markers
    const newMarkers = visibleEntryPoints.map(entryPoint => {
      const marker = new google.maps.Marker({
        position: entryPoint.location,
        map,
        title: `${entryPoint.name} - ${entryPoint.nameEn}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createEntryPointSVG(entryPoint))}`,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: 100,
      });

      // Add click listener
      marker.addListener('click', () => {
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(entryPoint),
        });

        infoWindow.open(map, marker);

        if (onEntryPointClick) {
          onEntryPointClick(entryPoint);
        }
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Cleanup function
    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, entryPoints, showPorts, showAirports, showBorders, onEntryPointClick]);

  return null; // This component doesn't render anything directly
};

export default EntryPointsLayer;
