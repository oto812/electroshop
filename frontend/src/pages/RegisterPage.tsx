import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/styles/shared';
import { toast } from 'sonner';

const FormCard = styled(Card)`
  width: 100%;
  max-width: 28rem;
`;

const FormBody = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const FooterText = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.font.sm};
  color: ${({ theme }) => theme.color.gray600};
  margin: 0;
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.color.blue600};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

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
    <AuthWrapper>
      <FormCard>
        <CardHeader>
          <CardTitle>{t('auth.register.title')}</CardTitle>
          <CardDescription>{t('auth.register.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormBody onSubmit={handleSubmit}>
            <FieldGroup>
              <Label htmlFor="email">{t('auth.register.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.register.emailPlaceholder')}
                required
              />
            </FieldGroup>
            <FieldGroup>
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
            </FieldGroup>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.register.creating') : t('auth.register.submit')}
            </Button>
            <FooterText>
              {t('auth.register.hasAccount')}{' '}
              <FooterLink to="/login">{t('auth.register.loginLink')}</FooterLink>
            </FooterText>
          </FormBody>
        </CardContent>
      </FormCard>
    </AuthWrapper>
  );
}
