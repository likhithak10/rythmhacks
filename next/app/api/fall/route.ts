// app/api/fall/route.ts
import { NextRequest, NextResponse } from 'next/server';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: write to Firestore here
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}


