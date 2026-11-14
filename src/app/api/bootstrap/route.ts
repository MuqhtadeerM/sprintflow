import { NextResponse } from "next/server";
import { readDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await readDb();
  if (!db) return new NextResponse(null, { status: 204 });
  return NextResponse.json(db);
}
