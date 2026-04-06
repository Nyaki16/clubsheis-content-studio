import { NextResponse } from 'next/server';
import { fetchClickUpClients } from '@/lib/clickup';
import { hardcodedClients } from '@/lib/clients';

export async function GET() {
  try {
    const clickUpClients = await fetchClickUpClients();
    if (clickUpClients.length > 0) {
      return NextResponse.json(clickUpClients);
    }
    return NextResponse.json(hardcodedClients);
  } catch {
    return NextResponse.json(hardcodedClients);
  }
}
