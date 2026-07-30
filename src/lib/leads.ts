/**
 * src/lib/leads.ts — ლიდების ოპერაციები (ეტაპი 2).
 * ყველა ჩაწერა ერთ ადგილას; RLS თავად ზღუდავს უფლებებს სერვერზე,
 * აქ მხოლოდ მოსახერხებელი ფენაა.
 */
import { supabase } from '@/lib/supabase';
import type { Lead, LeadStatus, Profile } from '@/types/crm';

type Result = { error: string | null };

/** სტატუსის შეცვლა; 'lost'-ზე გადასვლისას მიზეზიც ინახება */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  lossReason?: string
): Promise<Result> {
  const patch: Partial<Lead> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'lost') {
    patch.loss_reason = lossReason?.trim() || null;
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
      source: input.source?.trim() || 'mobile_app',
      notes: input.notes?.trim() || null,
      priority: input.priority || 'medium',
      status: 'new',
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
