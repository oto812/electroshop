import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold">
              ElectroShop
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              {t('nav.home')}
            </Link>
            <Link to="/cart" className="relative text-sm text-gray-600 hover:text-gray-900">
              {t('nav.cart')}
              {cartCount > 0 && (
                <span className="absolute -right-4 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated && (
              <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900">
                {t('nav.myOrders')}
              </Link>
            )}
            {user?.isAdmin && (
              <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                {t('nav.admin')}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.email}</span>
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
          </div>
        </div>
      </div>
    </nav>
  );
}
