import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold">
              ElectroShop
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link to="/cart" className="relative text-sm text-gray-600 hover:text-gray-900">
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-4 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated && (
              <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900">
                My Orders
              </Link>
            )}
            {user?.isAdmin && (
              <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.email}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}