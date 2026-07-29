/**
 * src/lib/deals.ts — გარიგებები (გაყიდვები).
 * გარიგება = დამტკიცებული ჯავშანი. RLS: agent მხოლოდ საკუთარს ხედავს,
 * მენეჯმენტი — ყველას; marketing — ვერცერთს.
 */
import { supabase } from '@/lib/supabase';

export interface Deal {
  id: string;
  aptCode: string;
  price: number | null;
  currency: string | null;
  leadName: string;
  agentName: string;
  reviewedAt: string | null;
}

export async function fetchDeals(): Promise<{
  deals: Deal[];
  totalValue: number;
  currency: string;
}> {
  const [{ data }, { data: profilesData }] = await Promise.all([
    supabase
      .from('booking_requests')
      .select('id, requested_by, reviewed_at, apartments(code, price, currency), leads(full_name)')
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(300),
    supabase.from('profiles').select('id, full_name'),
  ]);

  const nameById: Record<string, string> = {};
  for (const p of profilesData ?? []) nameById[p.id] = p.full_name ?? '—';

  interface Row {
    id: string;
    requested_by: string;
    reviewed_at: string | null;
    apartments: { code: string; price: number | null; currency: string | null } | null;
    leads: { full_name: string } | null;
  }

  const rows = (data as unknown as Row[]) ?? [];
  const deals: Deal[] = rows.map((r) => ({
    id: r.id,
    aptCode: r.apartments?.code ?? '—',
    price: r.apartments?.price ?? null,
    currency: r.apartments?.currency ?? null,
    leadName: r.leads?.full_name ?? '—',
    agentName: nameById[r.requested_by] ?? '—',
    reviewedAt: r.reviewed_at,
  }));

  return {
    deals,
    totalValue: deals.reduce((sum, d) => sum + (d.price ?? 0), 0),
    currency: deals.find((d) => d.currency)?.currency ?? '$',
  };
}
