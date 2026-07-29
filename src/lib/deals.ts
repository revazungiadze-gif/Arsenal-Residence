/**
 * src/lib/deals.ts — გარიგებები (გაყიდვები).
 *
 * წყარო ორია:
 *   1) გაყიდული ბინები (apartments.status='sold') — ასე აფიქსირებს გუნდი
 *      გაყიდვებს ვების ადმინკაში (დიაგნოსტიკით: 166 ცალი)
 *   2) დამტკიცებული ჯავშნები (booking_requests.approved) — აპის/ვების
 *      ჯავშნის ციკლით; აქ აგენტიც და კლიენტიც ცნობილია
 */
import { supabase } from '@/lib/supabase';

export interface Deal {
  id: string;
  aptCode: string;
  price: number | null;
  currency: string | null;
  leadName: string | null; // null = პირდაპირი გაყიდვა (ვების ადმინკიდან)
  agentName: string | null;
  date: string | null;
  source: 'booking' | 'sold';
}

export async function fetchDeals(): Promise<{
  deals: Deal[];
  totalValue: number;
  currency: string;
}> {
  const [{ data: bookings }, { data: soldApts }, { data: profilesData }] =
    await Promise.all([
      supabase
        .from('booking_requests')
        .select(
          'id, requested_by, reviewed_at, apartment_id, apartments(code, price, currency), leads(full_name)'
        )
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: false })
        .limit(300),
      supabase
        .from('apartments')
        .select('id, code, price, currency, updated_at')
        .eq('status', 'sold')
        .order('updated_at', { ascending: false })
        .limit(500),
      supabase.from('profiles').select('id, full_name'),
    ]);

  const nameById: Record<string, string> = {};
  for (const p of profilesData ?? []) nameById[p.id] = p.full_name ?? '—';

  interface BookingRow {
    id: string;
    requested_by: string;
    reviewed_at: string | null;
    apartment_id: string;
    apartments: { code: string; price: number | null; currency: string | null } | null;
    leads: { full_name: string } | null;
  }

  const bookingRows = (bookings as unknown as BookingRow[]) ?? [];
  const bookedAptIds = new Set(bookingRows.map((b) => b.apartment_id));

  const fromBookings: Deal[] = bookingRows.map((b) => ({
    id: `b-${b.id}`,
    aptCode: b.apartments?.code ?? '—',
    price: b.apartments?.price ?? null,
    currency: b.apartments?.currency ?? null,
    leadName: b.leads?.full_name ?? null,
    agentName: nameById[b.requested_by] ?? null,
    date: b.reviewed_at,
    source: 'booking',
  }));

  // sold ბინები, რომლებიც ჯავშნის ციკლში არ გასულა (პირდაპირი გაყიდვა)
  const fromSold: Deal[] = (soldApts ?? [])
    .filter((a) => !bookedAptIds.has(a.id))
    .map((a) => ({
      id: `s-${a.id}`,
      aptCode: a.code,
      price: a.price,
      currency: a.currency,
      leadName: null,
      agentName: null,
      date: a.updated_at,
      source: 'sold' as const,
    }));

  const deals = [...fromBookings, ...fromSold].sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '')
  );

  return {
    deals,
    totalValue: deals.reduce((sum, d) => sum + (d.price ?? 0), 0),
    currency: deals.find((d) => d.currency)?.currency ?? '$',
  };
}
