/**
 * src/lib/copilot.ts — AI კოპილოტი (ეტაპი 9).
 * ვების lead-analyzer-ის ზუსტი პორტი: დეტერმინისტული ქულა 0-100,
 * შემდეგი ნაბიჯი და follow-up ტექსტი. RLS ზღუდავს ხედვას როლით.
 * (გენერაციული Gemini-პასუხები ეტაპ 10-ში ჩაერთვება edge function-ით.)
 */
import { supabase } from '@/lib/supabase';
import type { Lead } from '@/types/crm';

export interface CopilotLead {
  lead: Lead;
  score: number;
  urgency: 'high' | 'medium' | 'low';
  nextAction: string;
  followUp: string;
}

/** ვების analyzeLeadPriority-ის იდენტური ფორმულა */
export function analyzeLeadPriority(lead: Lead): number {
  let score = 0;

  // სტადიის წონა (მაქს 35)
  const stageScores: Record<string, number> = {
    negotiation: 35,
    proposal: 30,
    qualified: 22,
    contacted: 14,
    new: 8,
    won: 0,
    lost: 0,
  };
  score += stageScores[lead.status] ?? 0;

  // სიახლის ბონუსი (მაქს 20)
  const ageHours =
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
  if (ageHours < 1) score += 20;
  else if (ageHours < 6) score += 16;
  else if (ageHours < 24) score += 12;
  else if (ageHours < 72) score += 6;

  // ბიუჯეტის წონა (მაქს 25)
  const budgetMax = lead.budget_max ?? 0;
  if (budgetMax >= 300_000) score += 25;
  else if (budgetMax >= 200_000) score += 20;
  else if (budgetMax >= 150_000) score += 15;
  else if (budgetMax >= 100_000) score += 10;
  else if (budgetMax > 0) score += 5;

  // წყაროს წონა (მაქს 12)
  const sourceScores: Record<string, number> = {
    referral: 12,
    direct: 10,
    website: 8,
    ai_chat: 8,
    social_media: 6,
    advertisement: 4,
    cold_call: 2,
  };
  score += sourceScores[lead.source ?? ''] ?? 3;

  // ელფოსტის ბონუსი (მაქს 8)
  if (lead.email) score += 8;

  return Math.min(100, Math.max(0, score));
}

/** ვების buildNextAction-ის იდენტური ტექსტები */
export function buildNextAction(lead: Lead, score: number): string {
  if (lead.status === 'new') return 'პირველი კონტაქტი — დარეკეთ დღეს';
  if (lead.status === 'contacted') return 'გაუგზავნეთ ბინების ფოტო/პრეზენტაცია';
  if (lead.status === 'qualified') return 'შეთავაზება მოამზადეთ და გაუგზავნეთ';
  if (lead.status === 'proposal') return 'შეთავაზებაზე პასუხი გამოითხოვეთ';
  if (lead.status === 'negotiation') {
    return score >= 70
      ? 'სასწრაფოდ დაუკავშირდით — მაღალი პოტენციალი'
      : 'მოლაპარაკება გააგრძელეთ';
  }
  return 'სტატუსი განაახლეთ';
}

export function scoreToUrgency(score: number): 'high' | 'medium' | 'low' {
  if (score > 80) return 'high';
  if (score > 50) return 'medium';
  return 'low';
}

/** Follow-up ტექსტი სტადიის მიხედვით (ვების fallback-ის გაფართოებული ვერსია) */
export function buildFollowUp(lead: Lead): string {
  const name = lead.full_name.split(' ')[0];
  switch (lead.status) {
    case 'new':
      return `გამარჯობა ${name}, არსენალი რეზიდენსიდან გწერთ — თქვენი განაცხადი მივიღეთ და სიამოვნებით გაგაცნობთ ჩვენს ბინებს. როდის იქნება მოხერხებული საუბარი?`;
    case 'contacted':
      return `გამარჯობა ${name}, გიგზავნით ჩვენი ბინების შერჩევას თქვენი მოთხოვნების მიხედვით. ნებისმიერ კითხვაზე მზად ვართ გიპასუხოთ.`;
    case 'qualified':
      return `გამარჯობა ${name}, მოგიმზადეთ პერსონალური შეთავაზება არსენალი რეზიდენსის ბინაზე. როდის შეძლებთ განხილვას?`;
    case 'proposal':
      return `გამარჯობა ${name}, გვინდა გავიგოთ თქვენი აზრი ჩვენს შეთავაზებაზე — ხომ არ გაქვთ დამატებითი კითხვები?`;
    case 'negotiation':
      return `გამარჯობა ${name}, მზად ვართ საბოლოო პირობებზე შევთანხმდეთ. დამატებით მოქნილობასაც განვიხილავთ — დაგვირეკეთ.`;
    default:
      return `გამარჯობა ${name}, არსენალი რეზიდენსი დაგიკავშირდებათ მალე.`;
  }
}

/** აქტიური ლიდები პრიორიტეტის კლებადობით */
export async function fetchCopilotLeads(limit = 20): Promise<CopilotLead[]> {
  // იგივე მოთხოვნა, რასაც ლიდების სია იყენებს; won/lost ფილტრი კლიენტზე —
  // .not(...,'in',...) სინტაქსი ზოგ გარემოში ცარიელს აბრუნებდა
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) console.warn('[copilot] query error:', error.message);

  const leads = ((data ?? []) as Lead[]).filter(
    (l) => l.status !== 'won' && l.status !== 'lost'
  );
  return leads
    .map((lead) => {
      const score = analyzeLeadPriority(lead);
      return {
        lead,
        score,
        urgency: scoreToUrgency(score),
        nextAction: buildNextAction(lead, score),
        followUp: buildFollowUp(lead),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const URGENCY_COLORS: Record<CopilotLead['urgency'], string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#22C55E',
};

export const URGENCY_LABELS: Record<CopilotLead['urgency'], string> = {
  high: 'სასწრაფო',
  medium: 'საშუალო',
  low: 'დაბალი',
};
