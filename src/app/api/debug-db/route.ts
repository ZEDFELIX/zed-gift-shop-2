import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{
      current_database: string;
      current_schema: string;
      product_table: string | null;
      admin_setting_table: string | null;
    }>>(`
      SELECT
        current_database() AS current_database,
        current_schema() AS current_schema,
        to_regclass('public."Product"')::text AS product_table,
        to_regclass('public."AdminSetting"')::text AS admin_setting_table
    `);

    return NextResponse.json({
      ok: true,
      env: {
        prisma: Boolean(process.env.zedgiftshop2_PRISMA_DATABASE_URL),
        database: Boolean(process.env.zedgiftshop2_DATABASE_URL),
        legacy: Boolean(process.env.DATABASE_URL),
      },
      db: rows[0] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        env: {
          prisma: Boolean(process.env.zedgiftshop2_PRISMA_DATABASE_URL),
          database: Boolean(process.env.zedgiftshop2_DATABASE_URL),
          legacy: Boolean(process.env.DATABASE_URL),
        },
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
