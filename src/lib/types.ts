export type Lang = "en" | "pl";

export interface I18nString {
  en?: string;
  pl?: string;
  [key: string]: string | undefined;
}

export interface I18nStringArray {
  en?: string[];
  pl?: string[];
  [key: string]: string[] | undefined;
}

export function localize(value: I18nString | null | undefined, lang: Lang): string {
  if (!value) return "";
  return value[lang] ?? value["en"] ?? "";
}

export function localizeArray(
  value: I18nStringArray | null | undefined,
  lang: Lang
): string[] {
  if (!value) return [];
  return value[lang] ?? value["en"] ?? [];
}

export interface ExerciseRow {
  id: string;
  external_id: string | null;
  name: I18nString;
  description: I18nString | null;
  muscle_groups: string[];
  equipment: string[];
  difficulty: string;
  movement_pattern: string | null;
  instructions: I18nStringArray | null;
  video_url: string | null;
  full_video_s3_key: string | null;
  preview_clip_s3_key: string | null;
  thumbnail_s3_key: string | null;
  duration_seconds: number | null;
  contributor_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
}

export interface ProductRow {
  id: string;
  type: string;
  title: string;
  exercise_ids: string[];
  price_cents: number;
  currency: string;
  provider_product_id: string | null;
  provider_price_id: string | null;
  active: boolean;
}

export interface UnlockRow {
  id: string;
  user_id: string;
  exercise_id: string;
  product_id: string | null;
  purchased_at: string;
  payment_id: string | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  valid_from: string;
  valid_until: string;
  provider_subscription_id: string;
}

export interface ContributorRow {
  user_id: string;
  verified: boolean;
  revenue_share_pct: string;
  created_at: string;
}

export interface EarningsRow {
  id: string;
  contributor_id: string;
  exercise_id: string;
  unlock_id: string;
  gross_amount_cents: number;
  revenue_share_pct: string;
  earnings_cents: number;
  period_month: string;
  payout_status: string;
  created_at: string;
}

export interface ReviewNoteRow {
  id: string;
  exercise_id: string;
  reviewer_id: string;
  action: string;
  note: string | null;
  created_at: string;
}
