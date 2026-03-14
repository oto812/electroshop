import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTitle, EmptyState } from '@/styles/shared';
import { toast } from 'sonner';

// ─── Styled components ────────────────────────────────────────────────────────

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const ItemContent = styled(CardContent)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[4]};
`;

const ItemImage = styled.img`
  height: 5rem;
  width: 5rem;
  border-radius: ${({ theme }) => theme.radius.md};
  object-fit: cover;
  flex-shrink: 0;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.h3`
  font-weight: ${({ theme }) => theme.weight.semibold};
  margin: 0 0 ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.font.base};
`;

const ItemPrice = styled.p`
  color: ${({ theme }) => theme.color.gray600};
  margin: 0;
  font-size: ${({ theme }) => theme.font.base};
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

const QuantityDisplay = styled.span`
  width: 2rem;
  text-align: center;
`;

const ItemSubtotal = styled.p`
  width: 6rem;
  text-align: right;
  font-weight: ${({ theme }) => theme.weight.semibold};
  margin: 0;
`;

const TotalBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[4]};
  margin-top: ${({ theme }) => theme.space[6]};
`;

const TotalAmount = styled.span`
  font-size: ${({ theme }) => theme.font.xl};
  font-weight: ${({ theme }) => theme.weight.bold};
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      <EmptyState>
        {t('cart.empty')}
        <Link to="/">
          <Button>{t('cart.continueShopping')}</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <PageTitle style={{ marginBottom: '1.5rem' }}>{t('cart.title')}</PageTitle>
      <ItemList>
        {cartItems.map((item) => (
          <Card key={item.productId}>
            <ItemContent>
              <ItemImage src={item.imageUrl} alt={item.name} />
              <ItemInfo>
                <ItemName>{item.name}</ItemName>
                <ItemPrice>${item.price.toFixed(2)}</ItemPrice>
              </ItemInfo>
              <QuantityControls>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                >
                  -
                </Button>
                <QuantityDisplay>{item.quantity}</QuantityDisplay>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                >
                  +
                </Button>
              </QuantityControls>
              <ItemSubtotal>${(item.price * item.quantity).toFixed(2)}</ItemSubtotal>
              <Button variant="destructive" size="sm" onClick={() => handleRemove(item.productId)}>
                {t('cart.remove')}
              </Button>
            </ItemContent>
          </Card>
        ))}
      </ItemList>

      <TotalBar>
        <TotalAmount>{t('cart.total', { amount: total.toFixed(2) })}</TotalAmount>
        <Button size="lg" onClick={() => navigate('/checkout')}>
          {t('cart.checkout')}
        </Button>
      </TotalBar>
    </div>
  );
}
