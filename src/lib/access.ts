import { getPool } from "./db";
import type { SubscriptionRow, UnlockRow, ContributorRow } from "./types";

export interface AccessResult {
  granted: boolean;
  reason: "subscription" | "unlock" | "denied";
}

export async function checkAccess(
  userId: string,
  exerciseId: string
): Promise<AccessResult> {
  const pool = getPool();

  // Single transaction: check subscription then unlock
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const subResult = await client.query<SubscriptionRow>(
      `SELECT id FROM user_subscriptions
       WHERE user_id = $1 AND status = 'ACTIVE' AND valid_until > now()
       LIMIT 1`,
      [userId]
    );
    if ((subResult.rowCount ?? 0) > 0) {
      await client.query("COMMIT");
      return { granted: true, reason: "subscription" };
    }

    const unlockResult = await client.query<UnlockRow>(
      `SELECT id FROM user_video_unlocks
       WHERE user_id = $1 AND exercise_id = $2
       LIMIT 1`,
      [userId, exerciseId]
    );
    await client.query("COMMIT");

    if ((unlockResult.rowCount ?? 0) > 0) {
      return { granted: true, reason: "unlock" };
    }
    return { granted: false, reason: "denied" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function createVideoUnlock(
  userId: string,
  exerciseId: string,
  productId: string | null,
  paymentId: string | null,
  contributorRevShare?: { contributorId: string; grossCents: number; revSharePct: number }
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const unlockResult = await client.query<{ id: string }>(
      `INSERT INTO user_video_unlocks (user_id, exercise_id, product_id, payment_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, exercise_id) DO NOTHING
       RETURNING id`,
      [userId, exerciseId, productId, paymentId]
    );

    if (contributorRevShare && (unlockResult.rowCount ?? 0) > 0) {
      const unlockId = unlockResult.rows[0]!.id;
      const { contributorId, grossCents, revSharePct } = contributorRevShare;
      const earningsCents = Math.floor(grossCents * revSharePct);
      const periodMonth = new Date().toISOString().slice(0, 7);
      await client.query(
        `INSERT INTO contributor_earnings
           (contributor_id, exercise_id, unlock_id, gross_amount_cents, revenue_share_pct, earnings_cents, period_month)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [contributorId, exerciseId, unlockId, grossCents, revSharePct, earningsCents, periodMonth]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function createBundleUnlocks(
  userId: string,
  productId: string,
  exerciseIds: string[],
  paymentId: string | null
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const exerciseId of exerciseIds) {
      await client.query(
        `INSERT INTO user_video_unlocks (user_id, exercise_id, product_id, payment_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, exercise_id) DO NOTHING`,
        [userId, exerciseId, productId, paymentId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function upsertSubscription(params: {
  userId: string;
  productId: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  validFrom: Date;
  validUntil: Date;
  providerSubscriptionId: string;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO user_subscriptions
       (user_id, product_id, status, valid_from, valid_until, provider_subscription_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (provider_subscription_id)
     DO UPDATE SET status = EXCLUDED.status, valid_until = EXCLUDED.valid_until`,
    [
      params.userId,
      params.productId,
      params.status,
      params.validFrom.toISOString(),
      params.validUntil.toISOString(),
      params.providerSubscriptionId,
    ]
  );
}

export async function getContributor(userId: string): Promise<ContributorRow | null> {
  const pool = getPool();
  const result = await pool.query<ContributorRow>(
    `SELECT * FROM fitvault_contributors WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function ensureContributor(userId: string): Promise<ContributorRow> {
  const pool = getPool();
  const result = await pool.query<ContributorRow>(
    `INSERT INTO fitvault_contributors (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return result.rows[0]!;
}
