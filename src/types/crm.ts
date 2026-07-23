/**
 * src/types/crm.ts
 *
 * CRM დომენის ტიპები და კონსტანტები — ვებ-CRM-ის სარკე.
 * წყარო: arsenal-web/lib/auth/rbac.ts და /api/crm/leads/route.ts
 */
import type { Database } from './database';

// ── ცხრილების მოკლე ალიასები ────────────────────────────────────────────
type Tables = Database['public']['Tables'];
export type Lead = Tables['leads']['Row'];
export type Profile = Tables['profiles']['Row'];
export type Task = Tables['tasks']['Row'];
export type NotificationRow = Tables['notifications']['Row'];
export type BookingRequest = Tables['booking_requests']['Row'];
export type Apartment = Tables['apartments']['Row'];

// ── როლები (rbac.ts-ის ზუსტი ასლი) ──────────────────────────────────────
export type AppRole =
  | 'admin'
  | 'director'
  | 'sales_manager'
  | 'agent'
  | 'marketing';

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'ადმინი',
  director: 'დირექტორი',
  sales_manager: 'გაყიდვების მენეჯერი',
  agent: 'აგენტი',
  marketing: 'მარკეტინგი',
};

export function dbRoleToAppRole(dbRole: string | null | undefined): AppRole {
  const map: Record<string, AppRole> = {
    admin: 'admin',
    director: 'director',
    sales_manager: 'sales_manager',
    agent: 'agent',
    marketing: 'marketing',
    // legacy fallbacks (ვებ-CRM-ის მსგავსად)
    viewer: 'marketing',
    sales: 'agent',
    manager: 'sales_manager',
  };
  // fail-closed: უცნობი როლი → ყველაზე დაბალპრივილეგირებული
  return (dbRole && map[dbRole]) || 'marketing';
}

// ── Lead pipeline სტატუსები (leads/route.ts-იდან) ───────────────────────
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'ახალი',
  contacted: 'დაკავშირებული',
  qualified: 'კვალიფიცირებული',
  proposal: 'შეთავაზება',
  negotiation: 'მოლაპარაკება',
  won: 'მოგებული',
  lost: 'დაკარგული',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#3B82F6',
  contacted: '#8B5CF6',
  qualified: '#06B6D4',
  proposal: '#F59E0B',
  negotiation: '#F97316',
  won: '#22C55E',
  lost: '#EF4444',
};

// ── პრიორიტეტი ──────────────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<string, string> = {
  low: 'დაბალი',
  medium: 'საშუალო',
  high: 'მაღალი',
  urgent: 'გადაუდებელი',
};
