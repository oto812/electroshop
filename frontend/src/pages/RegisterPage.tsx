import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', { email, password });
      login(data.token, data.user);

      // Merge guest cart
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        try {
          const items = JSON.parse(guestCart);
          if (items.length > 0) {
            await api.post('/cart/merge', { items }, {
              headers: { Authorization: `Bearer ${data.token}` },
            });
          }
          localStorage.removeItem('guestCart');
        } catch {
          // Ignore merge errors
        }
      }

      toast.success(t('auth.register.success'));
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('auth.register.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.register.title')}</CardTitle>
          <CardDescription>{t('auth.register.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.register.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.register.emailPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.register.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.register.passwordPlaceholder')}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.register.creating') : t('auth.register.submit')}
            </Button>
            <p className="text-center text-sm text-gray-600">
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                {t('auth.register.loginLink')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
