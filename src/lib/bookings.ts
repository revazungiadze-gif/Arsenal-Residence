/**
 * src/lib/bookings.ts — ჯავშნების ოპერაციები (ეტაპი 4).
 * ვების /api/crm/bookings ლოგიკის სარკე:
 *   • მოთხოვნა: ბინა უნდა იყოს available და მასზე pending არ არსებობდეს
 *   • დამტკიცება: booking→approved, ბინა→reserved, შეტყობინება მთხოვნელს
 *   • უარყოფა: booking→rejected (მიზეზით), ბინა→available, შეტყობინება
 */
import { supabase } from '@/lib/supabase';
import type { Apartment, BookingRequest, Lead } from '@/types/crm';

type Result = { error: string | null };

export type BookingWithRefs = BookingRequest & {
  apartments: Pick<Apartment, 'id' | 'code' | 'price' | 'currency' | 'area' | 'status'> | null;
  leads: Pick<Lead, 'id' | 'full_name' | 'phone'> | null;
};

export async function fetchBookings(): Promise<BookingWithRefs[]> {
  const { data } = await supabase
    .from('booking_requests')
    .select(
      '*, apartments(id, code, price, currency, area, status), leads(id, full_name, phone)'
    )
    .order('created_at', { ascending: false });
  return (data as BookingWithRefs[]) ?? [];
}

export async function fetchAvailableApartments(): Promise<Apartment[]> {
  const { data } = await supabase
    .from('apartments')
    .select('*')
    .eq('status', 'available')
    .order('code');
  return data ?? [];
}

export async function fetchMyLeads(): Promise<Lead[]> {
  const { data } = await supabase
    .from('leads')
    .select('id, full_name, phone, status, created_at')
    .order('created_at', { ascending: false })
    .limit(300);
  return ((data ?? []) as Lead[]).filter(
    (l) => l.status !== 'won' && l.status !== 'lost'
  );
}

export async function createBooking(input: {
  apartment_id: string;
  lead_id: string;
  note?: string;
  requested_by: string;
}): Promise<Result> {
  // ვების იდენტური შემოწმებები
  const { data: apt } = await supabase
    .from('apartments')
    .select('status')
    .eq('id', input.apartment_id)
    .single();
  if (apt?.status !== 'available') {
    return { error: 'ბინა აღარ არის ხელმისაწვდომი.' };
  }

  const { count } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('apartment_id', input.apartment_id)
    .eq('status', 'pending');
  if ((count ?? 0) > 0) {
    return { error: 'ამ ბინაზე უკვე არსებობს მოლოდინში მყოფი ჯავშანი.' };
  }

  const { error } = await supabase.from('booking_requests').insert({
    apartment_id: input.apartment_id,
    lead_id: input.lead_id,
    note: input.note?.trim() || null,
    requested_by: input.requested_by,
    status: 'pending',
  });
  return { error: error?.message ?? null };
}

export async function reviewBooking(
  booking: BookingWithRefs,
  action: 'approve' | 'reject' | 'cancel',
  reviewerId: string,
  rejectReason?: string
): Promise<Result> {
  if (action === 'reject' && !rejectReason?.trim()) {
    return { error: 'უარყოფის მიზეზი აუცილებელია.' };
  }
  // ვების წესი: მხოლოდ დამტკიცებული ჯავშანი უქმდება
  if (action === 'cancel' && booking.status !== 'approved') {
    return { error: 'მხოლოდ დამტკიცებული ჯავშნის გაუქმება შეიძლება.' };
  }

  const base = {
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  };
  const patch =
    action === 'approve'
      ? { ...base, status: 'approved' }
      : action === 'reject'
        ? { ...base, status: 'rejected', reject_reason: rejectReason!.trim().slice(0, 500) }
        : {
            ...base,
            status: 'cancelled',
            ...(rejectReason?.trim()
              ? { reject_reason: rejectReason.trim().slice(0, 500) }
              : {}),
          };

  const { error } = await supabase
    .from('booking_requests')
    .update(patch)
    .eq('id', booking.id);
  if (error) return { error: error.message };

  // ბინის სტატუსი — ვების ლოგიკის სარკე
  await supabase
    .from('apartments')
    .update({ status: action === 'approve' ? 'reserved' : 'available' })
    .eq('id', booking.apartment_id);

  // შეტყობინება მთხოვნელს
  const code = booking.apartments?.code ?? '';
  const notif =
    action === 'approve'
      ? { title: '✅ ჯავშანი დამტკიცდა', message: `ბინა ${code} დაჯავშნულია`, type: 'success' }
      : action === 'reject'
        ? { title: '❌ ჯავშანი უარყოფილია', message: `ბინა ${code} — მიზეზი: ${rejectReason}`, type: 'warning' }
        : {
            title: '↩️ ჯავშანი გაუქმდა',
            message: `ბინა ${code} კვლავ ხელმისაწვდომია${rejectReason?.trim() ? ` — მიზეზი: ${rejectReason}` : ''}`,
            type: 'warning',
          };
  await supabase.from('notifications').insert({
    user_id: booking.requested_by,
    ...notif,
  });

  return { error: null };
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'მოლოდინში',
  approved: 'დამტკიცებული',
  rejected: 'უარყოფილი',
  cancelled: 'გაუქმებული',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
  cancelled: '#6B7280',
};
