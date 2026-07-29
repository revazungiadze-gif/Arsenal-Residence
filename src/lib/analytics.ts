/**
 * src/lib/analytics.ts — ანალიტიკა + ბონუსები (ეტაპი 7).
 * ითვლება კლიენტზე ლიდებიდან/ჯავშნებიდან; RLS თავად ზღუდავს ხედვას
 * როლის მიხედვით (agent → საკუთარი; მენეჯმენტი → ყველა).
 * ბონუსის ფორმულა ვების /api/crm/bonus-ის იდენტურია.
 */
import { supabase } from '@/lib/supabase';
import { LEAD_STATUSES, type LeadStatus } from '@/types/crm';

export interface AnalyticsData {
  total: number;
  won: number;
  lost: number;
  active: number;
  conversion: number; // %
  byStatus: Record<LeadStatus, number>;
  topSources: { source: string; count: number }[];
  monthly: { label: string; count: number }[];
  lossReasons: { reason: string; count: number }[];
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const { data } = await supabase
    .from('leads')
    .select('status, source, created_at, loss_reason')
    .limit(5000);

  const leads = data ?? [];
  const byStatus = LEAD_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<LeadStatus, number>
  );
  const sources: Record<string, number> = {};
  const months: Record<string, number> = {};
  const reasons: Record<string, number> = {};

  for (const l of leads) {
    const s = (l.status as LeadStatus) ?? 'new';
    if (byStatus[s] != null) byStatus[s]++;
    const src = l.source?.trim() || 'უცნობი';
    sources[src] = (sources[src] ?? 0) + 1;
    const m = (l.created_at ?? '').slice(0, 7); // YYYY-MM
    if (m) months[m] = (months[m] ?? 0) + 1;
    if (l.status === 'lost') {
      const r = l.loss_reason?.trim() || 'მიზეზი უცნობია';
      reasons[r] = (reasons[r] ?? 0) + 1;
    }
  }

  const total = leads.length;
  const won = byStatus.won;
  const lost = byStatus.lost;

  // ბოლო 6 თვე, ცარიელი თვეების ჩათვლით
  const monthly: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly.push({
      label: d.toLocaleDateString('ka-GE', { month: 'short' }),
      count: months[key] ?? 0,
    });
  }

  const top = (rec: Record<string, number>, n: number) =>
    Object.entries(rec)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => ({ source: k, reason: k, count: v }));

  return {
    total,
    won,
    lost,
    active: total - won - lost,
    conversion: total > 0 ? Math.round((won / total) * 1000) / 10 : 0,
    byStatus,
    topSources: top(sources, 6),
    monthly,
    lossReasons: top(reasons, 6),
  };
}

// ── ბონუსები (ვების ფორმულის სარკე) ─────────────────────────────────────

export interface BonusSale {
  agentName: string;
  aptCode: string;
  price: number;
  bonus: number;
  reviewedAt: string;
}

export interface BonusData {
  monthLabel: string;
  sales: BonusSale[];
  totalBonus: number;
  byAgent: { agentName: string; totalBonus: number; salesCount: number }[];
}

function bonusRate(bedrooms: number, isParking: boolean): number {
  if (isParking) return 0.008;
  if (bedrooms >= 3) return 0.012;
  return 0.008;
}

export async function fetchBonuses(): Promise<BonusData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { data } = await supabase
    .from('booking_requests')
    .select(
      'id, requested_by, reviewed_at, apartments(code, bedrooms, price, parking), agent:profiles!booking_requests_requested_by_fkey(full_name)'
    )
    .eq('status', 'approved')
    .gte('reviewed_at', monthStart)
    .lt('reviewed_at', monthEnd)
    .order('reviewed_at', { ascending: false });

  interface Row {
    requested_by: string;
    reviewed_at: string;
    apartments: { code: string; bedrooms: number | null; price: number | null; parking: boolean | null } | null;
    agent: { full_name: string | null } | null;
  }

  const rows = (data as unknown as Row[]) ?? [];
  const sales: BonusSale[] = rows
    .filter((r) => r.apartments?.price)
    .map((r) => {
      const price = r.apartments!.price!;
      const rate = bonusRate(r.apartments!.bedrooms ?? 0, !!r.apartments!.parking);
      return {
        agentName: r.agent?.full_name ?? '—',
        aptCode: r.apartments!.code,
        price,
        bonus: Math.round(price * rate * 100) / 100,
        reviewedAt: r.reviewed_at,
      };
    });

  const byAgentMap: Record<string, { totalBonus: number; salesCount: number }> = {};
  for (const s of sales) {
    byAgentMap[s.agentName] ??= { totalBonus: 0, salesCount: 0 };
    byAgentMap[s.agentName].totalBonus =
      Math.round((byAgentMap[s.agentName].totalBonus + s.bonus) * 100) / 100;
    byAgentMap[s.agentName].salesCount++;
  }

  return {
    monthLabel: now.toLocaleDateString('ka-GE', { month: 'long', year: 'numeric' }),
    sales,
    totalBonus: Math.round(sales.reduce((sum, s) => sum + s.bonus, 0) * 100) / 100,
    byAgent: Object.entries(byAgentMap)
      .map(([agentName, v]) => ({ agentName, ...v }))
      .sort((a, b) => b.totalBonus - a.totalBonus),
  };
}
