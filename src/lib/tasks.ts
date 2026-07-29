/**
 * src/lib/tasks.ts — დავალებების ოპერაციები (ეტაპი 3).
 * სტატუსები ვების იდენტურია: pending / completed / cancelled.
 */
import { supabase } from '@/lib/supabase';
import type { Task } from '@/types/crm';

type Result = { error: string | null };

/** დავალება ლიდის სახელთან ერთად (join) */
export type TaskWithLead = Task & {
  leads: { full_name: string } | null;
};

export async function fetchTasks(): Promise<TaskWithLead[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*, leads(full_name)')
    .order('status', { ascending: true }) // completed ბოლოში არ იქნება ამით, ფილტრს UI აკეთებს
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  return (data as TaskWithLead[]) ?? [];
}

export async function createTask(input: {
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: string;
  assigned_to: string | null;
  created_by: string;
  lead_id?: string | null;
}): Promise<Result> {
  const { error } = await supabase.from('tasks').insert({
    title: input.title.trim(),
    description: input.description?.trim() || null,
    due_date: input.due_date ?? null,
    priority: input.priority || 'medium',
    status: 'pending',
    assigned_to: input.assigned_to,
    created_by: input.created_by,
    lead_id: input.lead_id ?? null,
  });
  return { error: error?.message ?? null };
}

export async function setTaskStatus(
  id: string,
  status: 'pending' | 'completed' | 'cancelled'
): Promise<Result> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteTask(id: string): Promise<Result> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  return { error: error?.message ?? null };
}

/** ვადის სწრაფი არჩევანი — თარიღების აკრეფის გარეშე */
export function quickDue(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0); // საღამოს 6 — სამუშაო დღის ბოლო
  return d.toISOString();
}

export function isOverdue(t: Task): boolean {
  return (
    t.status === 'pending' &&
    !!t.due_date &&
    new Date(t.due_date).getTime() < Date.now()
  );
}
