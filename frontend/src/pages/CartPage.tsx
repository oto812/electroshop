import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function CartPage() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch {
      toast.error(t('cart.updateError'));
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await removeFromCart(productId);
      toast.success(t('cart.removeSuccess'));
    } catch {
      toast.error(t('cart.removeError'));
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-lg text-gray-500">{t('cart.empty')}</p>
        <Link to="/">
          <Button>{t('cart.continueShopping')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('cart.title')}</h1>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <Card key={item.productId}>
            <CardContent className="flex items-center gap-4 p-4">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                >
                  -
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                >
                  +
                </Button>
              </div>
              <p className="w-24 text-right font-semibold">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(item.productId)}
              >
                {t('cart.remove')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
        <span className="text-xl font-bold">{t('cart.total', { amount: total.toFixed(2) })}</span>
        <Button size="lg" onClick={() => navigate('/checkout')}>
          {t('cart.checkout')}
        </Button>
      </div>
    </div>
  );
}
