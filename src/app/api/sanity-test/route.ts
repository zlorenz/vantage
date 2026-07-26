/**
 * Temporary stub — route removed; keeps Next generated types happy until rebuild.
 * Returns 410 Gone.
 */
import {NextResponse} from 'next/server'

export async function GET() {
  return NextResponse.json({error: 'Removed.'}, {status: 410})
}
