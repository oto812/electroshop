import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrders } from '@/lib/queries';
import { Card, CardContent } from '@/components/ui/card';

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  OutForDelivery: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
};

export function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="flex items-center justify-between p-4">
              <div className="h-5 w-24 rounded bg-gray-200" />
              <div className="h-5 w-20 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-lg text-gray-500">{t('orders.empty')}</p>
        <Link to="/" className="text-blue-600 hover:underline">
          {t('orders.startShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('orders.title')}</h1>
      <div className="space-y-4">
        {orders.map((order, index) => (
          <Link key={order.id} to={`/orders/${order.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{t('orders.orderNumber', { number: orders.length - index })}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold">${Number(order.totalAmount).toFixed(2)}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
                >
                  {t(`status.${order.status}`, order.status)}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
