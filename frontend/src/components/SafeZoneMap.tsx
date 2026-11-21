import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { SafeZone } from '../types/safezone.types';

interface SafeZoneMapProps {
  facilities: SafeZone[];
}

export function SafeZoneMap({ facilities }: SafeZoneMapProps) {
  return (
    <MapContainer center={[18.5204, 73.8567]} zoom={13} scrollWheelZoom className="leaflet-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {facilities.map((facility) => (
        <Marker key={facility.id} position={[facility.latitude, facility.longitude]}>
          <Popup>
            <strong>{facility.name}</strong>
            <br />
            {facility.category.replaceAll('_', ' ')} · {facility.distanceKm.toFixed(1)} km
            <br />
            {facility.verificationStatus === 'DEMO'
              ? 'Demonstration location · Not verified'
              : `Status: ${facility.verificationStatus}`}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
