import { getPool } from "./db";

export interface EarningsSummary {
  period_month: string;
  total_earnings_cents: number;
  payout_status: string;
}

export async function listContributorEarnings(
  contributorId: string
): Promise<EarningsSummary[]> {
  const pool = getPool();
  const result = await pool.query<EarningsSummary>(
    `SELECT period_month,
            SUM(earnings_cents) AS total_earnings_cents,
            MAX(payout_status) AS payout_status
     FROM contributor_earnings
     WHERE contributor_id = $1
     GROUP BY period_month
     ORDER BY period_month DESC`,
    [contributorId]
  );
  return result.rows.map((r) => ({
    period_month: r.period_month,
    total_earnings_cents: Number(r.total_earnings_cents),
    payout_status: r.payout_status,
  }));
}
