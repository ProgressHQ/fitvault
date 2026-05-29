import { getPool } from "./db";
import type { ProductRow } from "./types";

export async function listActiveProducts(): Promise<ProductRow[]> {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    `SELECT * FROM fitvault_products WHERE active = true ORDER BY price_cents`
  );
  return result.rows;
}

export async function getProduct(id: string): Promise<ProductRow | null> {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    `SELECT * FROM fitvault_products WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}
