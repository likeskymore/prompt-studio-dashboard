import mysql from "mysql2/promise";

type DbParam = string | number | boolean | null | Buffer | Date;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

export const baseDbService = {
  async query<T = unknown>(
    sql: string,
    params: DbParam[] = [],
  ): Promise<T> {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  },
};