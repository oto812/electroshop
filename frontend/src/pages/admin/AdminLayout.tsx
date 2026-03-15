import styled from 'styled-components';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ─── Styled components ────────────────────────────────────────────────────────

const Layout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[6]};
`;

const Sidebar = styled.aside`
  width: 12rem;
  flex-shrink: 0;
`;

const SidebarInner = styled.div`
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: #1f2937;
  padding: ${({ theme }) => theme.space[4]};
`;

const SidebarHeading = styled.h2`
  font-size: ${({ theme }) => theme.font.lg};
  font-weight: ${({ theme }) => theme.weight.bold};
  color: ${({ theme }) => theme.color.white};
  margin: 0 0 ${({ theme }) => theme.space[4]};
`;

const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

const SidebarLink = styled(NavLink)`
  display: block;
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
  font-size: ${({ theme }) => theme.font.sm};
  text-decoration: none;
  color: #d1d5db;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: #374151;
    color: ${({ theme }) => theme.color.white};
  }

  &.active {
    background-color: #111827;
    color: ${({ theme }) => theme.color.white};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLayout() {
  const { t } = useTranslation();

  return (
    <Layout>
      <Sidebar>
        <SidebarInner>
          <SidebarHeading>{t('adminLayout.heading')}</SidebarHeading>
          <SidebarNav>
            <SidebarLink to="/admin/products">{t('adminLayout.products')}</SidebarLink>
            <SidebarLink to="/admin/orders">{t('adminLayout.orders')}</SidebarLink>
          </SidebarNav>
        </SidebarInner>
      </Sidebar>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
}
