import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminOrders, useUpdateOrderStatus, queryKeys } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
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
import {
  PageHeader,
  PageTitle,
  StatusBadge,
  DataTable,
  TableHead,
  Th,
  Td,
  EmptyState,
  SkeletonBox,
} from '@/styles/shared';
import { toast } from 'sonner';
import { Socket } from 'socket.io-client';

// ─── Styled components ────────────────────────────────────────────────────────

const MapSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

const OrderLink = styled(Link)`
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.blue600};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const statuses = ['Pending', 'Processing', 'OutForDelivery', 'Delivered'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const [mapVisible, setMapVisible] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => socket.emit('joinAdminDashboard'));

    socket.on('newOrder', (order: any) => {
      queryClient.setQueryData(queryKeys.adminOrders, (old: any[] | undefined) =>
        old ? [order, ...old] : [order]
      );
      toast.info(t('adminOrders.newOrder', { id: order.id }));
    });

    return () => socket.disconnect();
  }, [queryClient, t]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    queryClient.setQueryData(queryKeys.adminOrders, (old: any[] | undefined) =>
      old ? old.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)) : old
    );
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success(t('adminOrders.statusUpdated', { id: orderId, status: t(`status.${newStatus}`) }));
    } catch {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders });
      toast.error(t('adminOrders.statusError'));
    }
  };

  if (isLoading) {
    return (
      <SkeletonWrapper>
        <SkeletonBox $h="2rem" $w="10rem" />
        <SkeletonBox $h="16rem" />
      </SkeletonWrapper>
    );
  }

  if (orders.length === 0) {
    return <EmptyState>{t('adminOrders.empty')}</EmptyState>;
  }

  return (
    <div>
      <PageHeader>
        <PageTitle>{t('adminOrders.title')}</PageTitle>
        <Button variant="outline" size="sm" onClick={() => setMapVisible(!mapVisible)}>
          {mapVisible ? t('adminOrders.hideMap') : t('adminOrders.showMap')}
        </Button>
      </PageHeader>

      {mapVisible && (
        <MapSection>
          <OrderMap orders={orders} />
        </MapSection>
      )}

      <Card>
        <CardContent style={{ padding: 0 }}>
          <DataTable>
            <TableHead>
              <tr>
                <Th>{t('adminOrders.colOrderId')}</Th>
                <Th>{t('adminOrders.colCustomer')}</Th>
                <Th>{t('adminOrders.colDate')}</Th>
                <Th>{t('adminOrders.colTotal')}</Th>
                <Th>{t('adminOrders.colStatus')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <Td>
                    <OrderLink to={`/admin/orders/${order.id}`}>#{order.id}</OrderLink>
                  </Td>
                  <Td>{order.user?.email}</Td>
                  <Td>{new Date(order.createdAt).toLocaleDateString()}</Td>
                  <Td>${Number(order.totalAmount).toFixed(2)}</Td>
                  <Td>
                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            <StatusBadge status={s}>{t(`status.${s}`)}</StatusBadge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
