import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  PageHeader,
  PageTitle,
  DataTable,
  TableHead,
  Th,
  ThRight,
  Td,
  TdRight,
  SkeletonBox,
} from '@/styles/shared';
import { toast } from 'sonner';

// ─── Styled components ────────────────────────────────────────────────────────

const LowStock = styled.span`
  color: #ef4444;
  font-weight: ${({ theme }) => theme.weight.medium};
`;

const ActionCell = styled(TdRight)`
  padding-right: ${({ theme }) => theme.space[4]};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[2]};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[4]};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const emptyForm = { name: '', description: '', imageUrl: '', price: 0, stockQuantity: 0 };

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminProductsPage() {
  const { data: products = [], isLoading } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAddDialog = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, description: product.description, imageUrl: product.imageUrl, price: product.price, stockQuantity: product.stockQuantity });
    setDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...payload });
        toast.success(t('adminProducts.updateSuccess'));
      } else {
        await createProduct.mutateAsync(payload);
        toast.success(t('adminProducts.createSuccess'));
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminProducts.saveError'));
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct.mutateAsync(deletingProduct.id);
      toast.success(t('adminProducts.deleteSuccess'));
      setDeleteDialogOpen(false);
    } catch {
      toast.error(t('adminProducts.deleteError'));
    }
  };

  const submitting = createProduct.isPending || updateProduct.isPending;

  if (isLoading) {
    return (
      <SkeletonWrapper>
        <SkeletonBox $h="2rem" $w="12rem" />
        <SkeletonBox $h="16rem" />
      </SkeletonWrapper>
    );
  }

  return (
    <div>
      <PageHeader>
        <PageTitle>{t('adminProducts.title')}</PageTitle>
        <Button onClick={openAddDialog}>{t('adminProducts.addProduct')}</Button>
      </PageHeader>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <DataTable>
            <TableHead>
              <tr>
                <Th>{t('adminProducts.colName')}</Th>
                <Th>{t('adminProducts.colPrice')}</Th>
                <Th>{t('adminProducts.colStock')}</Th>
                <ThRight>{t('adminProducts.colActions')}</ThRight>
              </tr>
            </TableHead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <Td style={{ fontWeight: 500 }}>{product.name}</Td>
                  <Td>${product.price.toFixed(2)}</Td>
                  <Td>
                    {product.stockQuantity === 0
                      ? <LowStock>{product.stockQuantity}</LowStock>
                      : product.stockQuantity}
                  </Td>
                  <ActionCell>
                    <ButtonGroup>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                        {t('adminProducts.edit')}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(product)}>
                        {t('adminProducts.delete')}
                      </Button>
                    </ButtonGroup>
                  </ActionCell>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? t('adminProducts.editTitle') : t('adminProducts.addTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FieldGroup>
              <Label>{t('adminProducts.nameLabel')}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FieldGroup>
            <FieldGroup>
              <Label>{t('adminProducts.descriptionLabel')}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </FieldGroup>
            <FieldGroup>
              <Label>{t('adminProducts.imageUrlLabel')}</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
            </FieldGroup>
            <FormGrid>
              <FieldGroup>
                <Label>{t('adminProducts.priceLabel')}</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required />
              </FieldGroup>
              <FieldGroup>
                <Label>{t('adminProducts.stockLabel')}</Label>
                <Input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })} required />
              </FieldGroup>
            </FormGrid>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('adminProducts.cancel')}</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t('adminProducts.saving') : editingProduct ? t('adminProducts.update') : t('adminProducts.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminProducts.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p>{t('adminProducts.deleteConfirm', { name: deletingProduct?.name })}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('adminProducts.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProduct.isPending}>{t('adminProducts.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
