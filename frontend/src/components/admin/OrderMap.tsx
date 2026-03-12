import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

interface Order {
  id: number;
  status: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  user?: { email: string };
}

interface OrderMapProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  OutForDelivery: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
};

export function OrderMap({ orders }: OrderMapProps) {
  const mappableOrders = orders.filter(
    (o) => o.deliveryLatitude && o.deliveryLongitude && (o.deliveryLatitude !== 0 || o.deliveryLongitude !== 0)
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mappableOrders.map((order) => (
        <Marker
          key={order.id}
          position={[order.deliveryLatitude!, order.deliveryLongitude!]}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">#{String(order.id).slice(0, 8)}</p>
              {order.user && <p className="text-gray-600">{order.user.email}</p>}
              <p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
                >
                  {order.status}
                </span>
              </p>
              <Link
                to={`/admin/orders/${order.id}`}
                className="mt-1 inline-block text-xs text-blue-600 hover:underline"
              >
                View Details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}