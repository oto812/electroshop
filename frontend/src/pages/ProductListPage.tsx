import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/lib/queries';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle, EmptyState, SkeletonCard, SkeletonBox } from '@/styles/shared';
import { toast } from 'sonner';

// ─── Styled components ────────────────────────────────────────────────────────

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[6]};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ProductCard = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const ProductImage = styled.img`
  height: 12rem;
  width: 100%;
  object-fit: cover;
  border-radius: ${({ theme }) => `${theme.radius.xl} ${theme.radius.xl} 0 0`};
`;

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.font.sm};
  color: ${({ theme }) => theme.color.gray600};
  margin: 0 0 ${({ theme }) => theme.space[2]};
`;

const ProductPrice = styled.p`
  font-size: ${({ theme }) => theme.font.xl};
  font-weight: ${({ theme }) => theme.weight.bold};
  margin: 0;
`;

const SkeletonImageBox = styled.div`
  height: 12rem;
  border-radius: ${({ theme }) => `${theme.radius.xl} ${theme.radius.xl} 0 0`};
  background-color: #e5e7eb;
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <SkeletonCard>
      <SkeletonImageBox />
      <CardHeader>
        <SkeletonBox $h="1.25rem" $w="75%" />
      </CardHeader>
      <CardContent>
        <SkeletonBox $h="1rem" $w="25%" />
      </CardContent>
      <CardFooter>
        <SkeletonBox $h="2.25rem" />
      </CardFooter>
    </SkeletonCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductListPage() {
  const { data: products = [], isLoading } = useProducts();
  const { addToCart } = useCart();
  const { t } = useTranslation();

  const handleAddToCart = async (product: typeof products[number]) => {
    try {
      await addToCart(
        { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl },
        1
      );
      toast.success(t('products.addedToCart', { name: product.name }));
    } catch {
      toast.error(t('products.addToCartError'));
    }
  };

  if (isLoading) {
    return (
      <ProductGrid>
        {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
      </ProductGrid>
    );
  }

  if (products.length === 0) {
    return <EmptyState>{t('products.empty')}</EmptyState>;
  }

  return (
    <div>
      <PageTitle style={{ marginBottom: '1.5rem' }}>{t('products.title')}</PageTitle>
      <ProductGrid>
        {products.map((product) => (
          <ProductCard key={product.id}>
            <ProductImage src={product.imageUrl} alt={product.name} />
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent style={{ flex: 1 }}>
              <ProductDescription>{product.description}</ProductDescription>
              <ProductPrice>${product.price.toFixed(2)}</ProductPrice>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAddToCart(product)}>
                {t('products.addToCart')}
              </Button>
            </CardFooter>
          </ProductCard>
        ))}
      </ProductGrid>
    </div>
  );
}
