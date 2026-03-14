import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// ─── Styled components ────────────────────────────────────────────────────────

const Nav = styled.nav`
  border-bottom: 1px solid var(--border);
  background-color: var(--background);
`;

const NavInner = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.space[4]};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: 0 ${({ theme }) => theme.space[6]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    padding: 0 ${({ theme }) => theme.space[8]};
  }
`;

const NavRow = styled.div`
  display: flex;
  height: ${({ theme }) => theme.space[16]};
  align-items: center;
  justify-content: space-between;
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[6]};
`;

const Brand = styled(Link)`
  font-size: ${({ theme }) => theme.font.xl};
  font-weight: ${({ theme }) => theme.weight.bold};
  color: var(--foreground);
  text-decoration: none;
`;

const NavLink = styled(Link)`
  font-size: ${({ theme }) => theme.font.sm};
  color: ${({ theme }) => theme.color.gray600};
  text-decoration: none;
  transition: color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.color.gray800};
  }
`;

const CartLinkWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const CartBadge = styled.span`
  position: absolute;
  right: -1rem;
  top: -0.5rem;
  display: flex;
  height: 1.25rem;
  width: 1.25rem;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.red500};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.color.white};
  line-height: 1;
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

const UserEmail = styled.span`
  font-size: ${({ theme }) => theme.font.sm};
  color: ${({ theme }) => theme.color.gray600};
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { t } = useTranslation();

  return (
    <Nav>
      <NavInner>
        <NavRow>
          <NavLeft>
            <Brand to="/">ElectroShop</Brand>
            <NavLink to="/">{t('nav.home')}</NavLink>
            <CartLinkWrapper>
              <NavLink to="/cart">{t('nav.cart')}</NavLink>
              {cartCount > 0 && <CartBadge>{cartCount}</CartBadge>}
            </CartLinkWrapper>
            {isAuthenticated && (
              <NavLink to="/orders">{t('nav.myOrders')}</NavLink>
            )}
            {user?.isAdmin && (
              <NavLink to="/admin">{t('nav.admin')}</NavLink>
            )}
          </NavLeft>

          <NavRight>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <UserEmail>{user?.email}</UserEmail>
                <Button variant="outline" size="sm" onClick={logout}>
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </NavRight>
        </NavRow>
      </NavInner>
    </Nav>
  );
}
