import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrders } from '@/lib/queries';
import { Card, CardContent } from '@/components/ui/card';
import { PageTitle, StatusBadge, EmptyState, SkeletonBox } from '@/styles/shared';

// ─── Styled components ────────────────────────────────────────────────────────

const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const OrderCardLink = styled(Link)`
  display: block;
  text-decoration: none;
`;

const OrderCardContent = styled(CardContent)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]};
`;

const OrderInfo = styled.div``;

const OrderNumber = styled.p`
  font-weight: ${({ theme }) => theme.weight.semibold};
  margin: 0 0 ${({ theme }) => theme.space[1]};
`;

const OrderDate = styled.p`
  font-size: ${({ theme }) => theme.font.sm};
  color: ${({ theme }) => theme.color.gray500};
  margin: 0;
`;

const OrderAmount = styled.p`
  font-weight: ${({ theme }) => theme.weight.semibold};
  margin: 0;
`;

const SkeletonRow = styled(CardContent)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]};
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <OrderList>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <SkeletonRow>
              <SkeletonBox $h="1.25rem" $w="6rem" />
              <SkeletonBox $h="1.25rem" $w="5rem" />
              <SkeletonBox $h="1.25rem" $w="4rem" />
            </SkeletonRow>
          </Card>
        ))}
      </OrderList>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState>
        {t('orders.empty')}
        <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          {t('orders.startShopping')}
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <PageTitle style={{ marginBottom: '1.5rem' }}>{t('orders.title')}</PageTitle>
      <OrderList>
        {orders.map((order, index) => (
          <OrderCardLink key={order.id} to={`/orders/${order.id}`}>
            <Card>
              <OrderCardContent>
                <OrderInfo>
                  <OrderNumber>
                    {t('orders.orderNumber', { number: orders.length - index })}
                  </OrderNumber>
                  <OrderDate>{new Date(order.createdAt).toLocaleDateString()}</OrderDate>
                </OrderInfo>
                <OrderAmount>${Number(order.totalAmount).toFixed(2)}</OrderAmount>
                <StatusBadge status={order.status}>
                  {t(`status.${order.status}`, order.status)}
                </StatusBadge>
              </OrderCardContent>
            </Card>
          </OrderCardLink>
        ))}
      </OrderList>
    </div>
  );
}
