import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders, useUpdateOrderStatus } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries';
import { createSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderMap } from '@/components/admin/OrderMap';
import { toast } from 'sonner';
import { Socket } from 'socket.io-client';
import { useState } from 'react';

const statuses = ['Pending', 'Processing', 'OutForDelivery', 'Delivered'];

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  OutForDelivery: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
};

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const [mapVisible, setMapVisible] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.connect();

    socket.on('connect', () => {
      socket.emit('joinAdminDashboard');
    });

    socket.on('newOrder', (order: any) => {
      queryClient.setQueryData(queryKeys.adminOrders, (old: any[] | undefined) =>
        old ? [order, ...old] : [order]
      );
      toast.info(`New order #${order.id} received!`);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    // Optimistic update
    queryClient.setQueryData(queryKeys.adminOrders, (old: any[] | undefined) =>
      old ? old.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)) : old
    );

    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders });
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="h-64 rounded bg-gray-200" />
    </div>;
  }

  if (orders.length === 0) {
    return <div className="py-12 text-center text-gray-500">No orders yet</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Orders</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMapVisible(!mapVisible)}
        >
          {mapVisible ? 'Hide Map' : 'Show Map'}
        </Button>
      </div>

      {mapVisible && (
        <div className="mb-6">
          <OrderMap orders={orders} />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.user?.email}</td>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">${Number(order.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[s]}`}>
                              {s}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
