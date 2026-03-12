import { NavLink, Outlet } from 'react-router-dom';

export function AdminLayout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

  return (
    <div className="flex gap-6">
      <aside className="w-48 shrink-0">
        <div className="rounded-lg bg-gray-800 p-4">
          <h2 className="mb-4 text-lg font-bold text-white">Admin</h2>
          <nav className="space-y-1">
            <NavLink to="/admin/products" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/admin/orders" className={linkClass}>
              Orders
            </NavLink>
          </nav>
        </div>
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}