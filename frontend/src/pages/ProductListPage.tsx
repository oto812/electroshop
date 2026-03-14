import { useProducts } from '@/lib/queries';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function ProductSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="h-48 rounded-t-lg bg-gray-200" />
      <CardHeader>
        <div className="h-5 w-3/4 rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-4 w-1/4 rounded bg-gray-200" />
      </CardContent>
      <CardFooter>
        <div className="h-9 w-full rounded bg-gray-200" />
      </CardFooter>
    </Card>
  );
}

export function ProductListPage() {
  const { data: products = [], isLoading } = useProducts();
  const { addToCart } = useCart();

  const handleAddToCart = async (product: typeof products[number]) => {
    try {
      await addToCart(
        { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl },
        1
      );
      toast.success(`${product.name} added to cart`);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No products available at the moment.
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Products</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-48 w-full rounded-t-lg object-cover"
            />
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="mb-2 text-sm text-gray-600">{product.description}</p>
              <p className="text-xl font-bold">${product.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAddToCart(product)}>
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
