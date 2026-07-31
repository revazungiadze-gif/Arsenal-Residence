/**
 * src/lib/leads.ts — ლიდების ოპერაციები (ეტაპი 2).
 * ყველა ჩაწერა ერთ ადგილას; RLS თავად ზღუდავს უფლებებს სერვერზე,
 * აქ მხოლოდ მოსახერხებელი ფენაა.
 */
import { supabase } from '@/lib/supabase';
import { LEAD_SOURCES, LOSS_REASONS } from '@/types/crm';
import type { Lead, LeadStatus, Profile } from '@/types/crm';

type Result = { error: string | null };

/**
 * სტატუსის შეცვლა; 'lost'-ზე გადასვლისას მიზეზი enum-იდან ინახება
 * (ბაზის leads_loss_reason_check ამას ითხოვს), თავისუფალი ტექსტი — loss_note-ში.
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  lossReason?: string,
  lossNote?: string
): Promise<Result> {
  const patch: Partial<Lead> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if ((status as string) === 'lost' || status === 'not_interested') {
    patch.loss_reason = (LOSS_REASONS as readonly string[]).includes(
      lossReason ?? ''
    )
      ? lossReason
      : 'other';
    patch.loss_note = lossNote?.trim() || null;
  }
  const { error } = await supabase.from('leads').update(patch).eq('id', id);
  return { error: error?.message ?? null };
}

/** შენიშვნის დამატება (ავტორი ყოველთვის მიმდინარე მომხმარებელი) */
export async function addLeadNote(
  leadId: string,
  content: string,
  userId: string
): Promise<Result> {
  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    content: content.trim(),
    user_id: userId,
    author_id: userId,
  });
  return { error: error?.message ?? null };
}

/**
 * ლიდის ველების რედაქტირება — ვების allowlist-ის სარკე:
 * agent: budget_min/max, notes; მენეჯმენტი: + full_name, phone, email, source.
 * (RLS დამატებით იცავს ბაზის დონეზე.)
 */
export async function updateLeadFields(
  id: string,
  patch: Partial<
    Pick<
      Lead,
      'full_name' | 'phone' | 'email' | 'source' | 'budget_min' | 'budget_max' | 'notes'
    >
  >
): Promise<Result> {
  const { error } = await supabase
    .from('leads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error?.message ?? null };
}

// ── ბინის ინტერესები (lead_apartment_interests) ─────────────────────────

export interface LeadInterest {
  id: string;
  apartment_id: string | null;
  apartment_code: string | null;
}

export async function fetchLeadInterests(leadId: string): Promise<LeadInterest[]> {
  const { data } = await supabase
    .from('lead_apartment_interests')
    .select('id, apartment_id, apartment_code')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return (data as LeadInterest[]) ?? [];
}

export async function removeLeadInterest(interestId: string): Promise<Result> {
  const { error } = await supabase
    .from('lead_apartment_interests')
    .delete()
    .eq('id', interestId);
  return { error: error?.message ?? null };
}

/** შენიშვნის წაშლა (RLS: მხოლოდ ავტორი ან admin/director) */
export async function deleteLeadNote(noteId: string): Promise<Result> {
  const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
  return { error: error?.message ?? null };
}

/** ახალი ლიდის შექმნა */
export async function createLead(input: {
  full_name: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  priority?: string;
  assigned_to: string | null;
}): Promise<Result & { id?: string }> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      // ბაზა source-ზე CHECK-ს ამოწმებს — უცნობი მნიშვნელობა 'other' ხდება
      source: (LEAD_SOURCES as readonly string[]).includes(
        input.source?.trim() ?? ''
      )
        ? input.source!.trim()
        : 'other',
      notes: input.notes?.trim() || null,
      priority: input.priority || 'medium',
      status: 'to_contact',
      assigned_to: input.assigned_to,
      assigned_at: input.assigned_to ? new Date().toISOString() : null,
    })
    .select('id')
    .single();
  return { error: error?.message ?? null, id: data?.id };
}

/** ლიდის მინიჭება თანამშრომელზე (მხოლოდ მენეჯმენტი — RLS იცავს) */
export async function assignLead(
  leadId: string,
  userId: string | null
): Promise<Result> {
  const { error } = await supabase
    .from('leads')
    .update({
      assigned_to: userId,
      assigned_at: userId ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);
  return { error: error?.message ?? null };
}

/** გუნდის წევრები (მინიჭების ასარჩევად) */
export async function fetchTeam(): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('full_name');
  return data ?? [];
}
