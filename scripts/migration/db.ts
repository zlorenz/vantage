import mysql from 'mysql2/promise';
import { WP_DB, WP_TABLE_PREFIX } from './config';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...WP_DB,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

export async function query<T extends mysql.RowDataPacket[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export function table(name: string): string {
  return `${WP_TABLE_PREFIX}${name}`;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
