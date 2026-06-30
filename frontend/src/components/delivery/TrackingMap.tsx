'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, type Libraries } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import type { LngLat, TrackingSnapshot } from '@/types/delivery';

const CONTAINER = { width: '100%', height: '100%' };
const LIBRARIES: Libraries = ['geometry'];
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
  styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
};

function FallbackPanel({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-50 text-center px-6">
      <MapPin className="w-6 h-6 text-neutral-300" />
      <p className="text-[12px] text-neutral-400 max-w-[260px]">{message}</p>
    </div>
  );
}

export default function TrackingMap({
  snapshot,
  driverPosition,
}: {
  snapshot: TrackingSnapshot;
  driverPosition: LngLat | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'pharmalink-gmaps',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const pickup = { lat: snapshot.pickup.lat, lng: snapshot.pickup.lng };
  const dropoff = { lat: snapshot.dropoff.lat, lng: snapshot.dropoff.lng };
  const driver = driverPosition ? { lat: driverPosition.lat, lng: driverPosition.lng } : null;

  const routePath = useMemo(() => {
    if (!isLoaded || !snapshot.route?.polyline) return [];
    try {
      return google.maps.geometry.encoding.decodePath(snapshot.route.polyline);
    } catch {
      return [];
    }
  }, [isLoaded, snapshot.route?.polyline]);

  const wrap = 'relative w-full h-[320px] sm:h-[380px] rounded-[20px] overflow-hidden border border-neutral-100 shadow-md bg-neutral-50';

  if (!apiKey) {
    return (
      <div className={wrap}>
        <FallbackPanel message="Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the live map. Live status, ETA and driver info still work." />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className={wrap}>
        <FallbackPanel message="Couldn't load the map. Check your connection or the Maps API key." />
      </div>
    );
  }
  if (!isLoaded) {
    return <div className={`${wrap} animate-pulse`} />;
  }

  return (
    <div className={wrap}>
      <GoogleMap
        mapContainerStyle={CONTAINER}
        center={driver ?? pickup}
        zoom={14}
        options={MAP_OPTIONS}
        onLoad={(m) => setMap(m)}
        onUnmount={() => setMap(null)}
      >
        {routePath.length > 0 && (
          <PolylineF
            path={routePath}
            options={{ strokeColor: '#2563eb', strokeOpacity: 0.85, strokeWeight: 4 }}
          />
        )}

        <MarkerF
          position={pickup}
          title="Pharmacy"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
        />
        <MarkerF
          position={dropoff}
          title="Your location"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#111827',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
        />
        {driver && (
          <MarkerF
            position={driver}
            title="Driver"
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              rotation: snapshot.driverLocation?.heading ?? 0,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
