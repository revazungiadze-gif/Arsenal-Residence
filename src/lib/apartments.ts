/**
 * src/lib/apartments.ts — ბინები/ინვენტარი (ეტაპი 6).
 */
import { supabase } from '@/lib/supabase';
import type { Apartment, Lead } from '@/types/crm';

export type ApartmentWithRefs = Apartment & {
  blocks: { name: string } | null;
  floors: { number: number } | null;
};

export interface ApartmentImage {
  id: string;
  url: string;
  type: string | null;
  order_index: number | null;
}

export async function fetchApartments(): Promise<ApartmentWithRefs[]> {
  const { data } = await supabase
    .from('apartments')
    .select('*, blocks(name), floors(number)')
    .order('code');
  return (data as ApartmentWithRefs[]) ?? [];
}

export async function fetchApartmentImages(
  apartmentId: string
): Promise<ApartmentImage[]> {
  const { data } = await supabase
    .from('apartment_images')
    .select('id, url, type, order_index')
    .eq('apartment_id', apartmentId)
    .order('order_index');
  return (data as ApartmentImage[]) ?? [];
}

/** ლიდის ინტერესის მიბმა ბინაზე (lead_apartment_interests) */
export async function addLeadInterest(
  leadId: string,
  apartment: Apartment
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('lead_apartment_interests').insert({
    lead_id: leadId,
    apartment_id: apartment.id,
    apartment_code: apartment.code,
    interest_type: 'interested',
  });
  return { error: error?.message ?? null };
}

export async function fetchActiveLeads(): Promise<Lead[]> {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .not('status', 'in', '(won,lost)')
    .order('created_at', { ascending: false })
    .limit(200);
  return data ?? [];
}

export const APT_STATUS_LABELS: Record<string, string> = {
  available: 'ხელმისაწვდომი',
  reserved: 'დაჯავშნული',
  sold: 'გაყიდული',
};

export const APT_STATUS_COLORS: Record<string, string> = {
  available: '#22C55E',
  reserved: '#F59E0B',
  sold: '#EF4444',
};

export function fmtPrice(a: Apartment): string {
  if (!a.price) return '—';
  return `${a.price.toLocaleString('ka-GE')} ${a.currency ?? '$'}`;
}
