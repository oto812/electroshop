import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Popup,
  useMap,
} from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';

interface OrderRouteMapProps {
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryAddress: string;
}

const BASE_LAT = 41.6941;
const BASE_LNG = 44.8017;

function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

export function OrderRouteMap({
  deliveryLatitude,
  deliveryLongitude,
  deliveryAddress,
}: OrderRouteMapProps) {
  const [routePoints, setRoutePoints] = useState<LatLngExpression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasValidCoordinates =
    Number.isFinite(deliveryLatitude) &&
    Number.isFinite(deliveryLongitude) &&
    deliveryLatitude !== 0 &&
    deliveryLongitude !== 0;

  useEffect(() => {
    const fetchRoute = async () => {
      if (!hasValidCoordinates) {
        setError('Invalid delivery coordinates');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${BASE_LNG},${BASE_LAT};${deliveryLongitude},${deliveryLatitude}` +
          `?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }

        const data = await response.json();

        const coordinates = data?.routes?.[0]?.geometry?.coordinates;

        if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
          throw new Error('No route found');
        }

        const converted: LatLngExpression[] = coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        setRoutePoints(converted);
      } catch {
        setError('Failed to load route');
        setRoutePoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [deliveryLatitude, deliveryLongitude, hasValidCoordinates]);

  const markerPoints = useMemo<LatLngExpression[]>(
    () => [
      [BASE_LAT, BASE_LNG],
      [deliveryLatitude, deliveryLongitude],
    ],
    [deliveryLatitude, deliveryLongitude]
  );

  if (loading) {
    return (
      <div className="flex h-100 items-center justify-center rounded-lg border bg-gray-50 text-sm text-gray-500">
        Loading route...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-100 items-center justify-center rounded-lg border bg-red-50 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={[BASE_LAT, BASE_LNG]}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={markerPoints} />

        <Marker position={[BASE_LAT, BASE_LNG]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Warehouse</p>
              <p>Freedom Square, Tbilisi</p>
            </div>
          </Popup>
        </Marker>

        <Marker position={[deliveryLatitude, deliveryLongitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Delivery Location</p>
              <p>{deliveryAddress}</p>
            </div>
          </Popup>
        </Marker>

        {routePoints.length > 0 && <Polyline positions={routePoints} />}
      </MapContainer>
    </div>
  );
}