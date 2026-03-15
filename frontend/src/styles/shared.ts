import styled, { keyframes } from 'styled-components';
import { type Theme } from './theme';

// ─── Layout ───────────────────────────────────────────────────────────────────

/** Centered content area used inside page wrappers */
export const PageContainer = styled.div`
  max-width: 80rem;
  margin: 0 auto;
`;

/** Row with title on the left and an action (e.g. button) on the right */
export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.font['2xl']};
  font-weight: ${({ theme }) => theme.weight.bold};
  margin: 0;
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.xl};
  font-weight: ${({ theme }) => theme.weight.semibold};
  margin: 0;
`;

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
  theme?: Theme;
}

export const StatusBadge = styled.span<StatusBadgeProps>`
  display: inline-block;
  border-radius: ${({ theme }) => theme.radius.full};
  padding: 0.25rem 0.75rem;
  font-size: ${({ theme }) => theme.font.sm};
  font-weight: ${({ theme }) => theme.weight.medium};
  background-color: ${({ theme, status }) =>
    theme.color.status[status]?.bg ?? '#f3f4f6'};
  color: ${({ theme, status }) =>
    theme.color.status[status]?.text ?? '#374151'};
`;

// ─── Empty State ──────────────────────────────────────────────────────────────

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[12]} 0;
  color: ${({ theme }) => theme.color.gray500};
  font-size: ${({ theme }) => theme.font.lg};
`;

// ─── Skeleton / Loading ───────────────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

export const SkeletonBox = styled.div<{ $h?: string; $w?: string; $rounded?: string }>`
  background-color: #e5e7eb;
  border-radius: ${({ $rounded }) => $rounded ?? '0.375rem'};
  height: ${({ $h }) => $h ?? '1.25rem'};
  width: ${({ $w }) => $w ?? '100%'};
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

export const SkeletonCard = styled.div`
  border: 1px solid var(--border);
  border-radius: ${({ theme }) => theme.radius.xl};
  overflow: hidden;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

// ─── Auth / Centred forms ─────────────────────────────────────────────────────

export const AuthWrapper = styled.div`
  display: flex;
  min-height: 80vh;
  align-items: center;
  justify-content: center;
`;

// ─── Narrow page container (checkout / order detail) ─────────────────────────

export const NarrowContainer = styled.div<{ $maxWidth?: string }>`
  margin: 0 auto;
  max-width: ${({ $maxWidth }) => $maxWidth ?? '48rem'};
`;

// ─── Confirmation banner ──────────────────────────────────────────────────────

export const ConfirmationBanner = styled.div`
  background-color: #f0fdf4;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[4]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

export const ConfirmationTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.xl};
  font-weight: ${({ theme }) => theme.weight.bold};
  color: #166534;
  margin: 0 0 ${({ theme }) => theme.space[1]};
`;

export const ConfirmationText = styled.p`
  color: #15803d;
  margin: 0;
`;

// ─── Data table ───────────────────────────────────────────────────────────────

export const DataTable = styled.table`
  width: 100%;
  font-size: ${({ theme }) => theme.font.sm};
  border-collapse: collapse;
`;

export const TableHead = styled.thead`
  background-color: #f9fafb;
`;

export const Th = styled.th`
  padding: ${({ theme }) => `${theme.space[3]} ${theme.space[4]}`};
  text-align: left;
  font-weight: ${({ theme }) => theme.weight.medium};
  font-size: ${({ theme }) => theme.font.sm};
  border-bottom: 1px solid var(--border);
`;

export const ThRight = styled(Th)`
  text-align: right;
`;

export const Td = styled.td`
  padding: ${({ theme }) => `${theme.space[3]} ${theme.space[4]}`};
  border-bottom: 1px solid var(--border);

  tr:last-child & {
    border-bottom: none;
  }
`;

export const TdRight = styled(Td)`
  text-align: right;
`;

// ─── Misc helpers ─────────────────────────────────────────────────────────────

export const MutedText = styled.p`
  color: ${({ theme }) => theme.color.gray500};
  font-size: ${({ theme }) => theme.font.sm};
  margin: 0;
`;

export const SmallMutedText = styled.span`
  color: ${({ theme }) => theme.color.gray500};
  font-size: ${({ theme }) => theme.font.sm};
`;
