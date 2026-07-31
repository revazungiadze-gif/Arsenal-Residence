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

// ── Lead pipeline სტატუსები — ცოცხალი (EU) ბაზის leads_status_check-ის
// მიხედვით. ეს ის სტატუსებია, რომლებსაც ახალი ვები რეალურად იყენებს.
export const LEAD_STATUSES = [
  'to_contact',
  'no_answer',
  'contact_later',
  'interested',
  'negotiation',
  'won',
  'not_interested',
  'invalid',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<string, string> = {
  to_contact: 'დასაკავშირებელი',
  no_answer: 'არ უპასუხა',
  contact_later: 'მოგვიანებით',
  interested: 'დაინტერესებული',
  negotiation: 'მოლაპარაკება',
  won: 'მოგებული',
  not_interested: 'არ აინტერესებს',
  invalid: 'არავალიდური',
  // ძველი (ბაზაში ჯერ კიდევ დაშვებული) სტატუსები — ჩვენებისთვის
  new: 'ახალი',
  assigned: 'მინიჭებული',
  contacted: 'დაკავშირებული',
  qualified: 'კვალიფიცირებული',
  proposal: 'შეთავაზება',
  lost: 'დაკარგული',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  to_contact: '#3B82F6',
  no_answer: '#F59E0B',
  contact_later: '#8B5CF6',
  interested: '#06B6D4',
  negotiation: '#F97316',
  won: '#22C55E',
  not_interested: '#EF4444',
  invalid: '#6B7280',
  new: '#3B82F6',
  assigned: '#8B5CF6',
  contacted: '#8B5CF6',
  qualified: '#06B6D4',
  proposal: '#F59E0B',
  lost: '#EF4444',
};

/** „დახურული" სტატუსები — აქტიური სამუშაო სიებიდან გამოირიცხება */
export const CLOSED_LEAD_STATUSES: readonly string[] = [
  'won',
  'lost',
  'not_interested',
  'invalid',
];

// ── პრიორიტეტი ──────────────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<string, string> = {
  low: 'დაბალი',
  medium: 'საშუალო',
  high: 'მაღალი',
  urgent: 'გადაუდებელი',
};

// ბაზის leads_source_check შეზღუდვის დაშვებული მნიშვნელობები —
// აპმა მხოლოდ ეს values უნდა გააგზავნოს, ეკრანზე კი ქართული ლეიბლი აჩვენოს
export const LEAD_SOURCES = [
  'call',
  'website',
  'social',
  'referral',
  'walk_in',
  'chat',
  'broker',
  'other',
] as const;

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  call: 'ზარი',
  website: 'საიტი',
  social: 'სოც. ქსელი',
  referral: 'რეკომენდაცია',
  walk_in: 'ვიზიტი',
  chat: 'ჩატი',
  reservation: 'ჯავშანი',
  investors_page: 'ინვესტორები',
  apartment_inquiry: 'ბინის მოთხოვნა',
  contact_form: 'საკონტაქტო ფორმა',
  broker: 'ბროკერი',
  other: 'სხვა',
};

// ბაზის leads_loss_reason_check შეზღუდვის მნიშვნელობები
export const LOSS_REASONS = [
  'price',
  'payment_terms',
  'competitor',
  'product',
  'location',
  'timing',
  'unreachable',
  'service',
  'other',
] as const;

export const LOSS_REASON_LABELS: Record<string, string> = {
  price: 'ფასი',
  payment_terms: 'გადახდის პირობები',
  competitor: 'კონკურენტი',
  product: 'პროდუქტი',
  location: 'ლოკაცია',
  timing: 'დრო/ვადები',
  unreachable: 'ვერ დავუკავშირდით',
  service: 'მომსახურება',
  other: 'სხვა',
};
