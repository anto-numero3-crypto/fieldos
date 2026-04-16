import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

function isCanadianCoord(lat: number, lng: number): boolean {
  return lat >= 42 && lat <= 83 && lng >= -141 && lng <= -52
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json().catch(() => null) as { location_lat?: number; location_lng?: number } | null
  if (!body) return NextResponse.json({ error: 'Missing body' }, { status: 400 })
  const lat = Number(body.location_lat)
  const lng = Number(body.location_lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }
  if (!isCanadianCoord(lat, lng)) {
    return NextResponse.json({ error: 'Coordinates outside Canada' }, { status: 400 })
  }

  const supabase = adminClient()
  const { error } = await supabase
    .from('organizations')
    .update({ location_lat: lat, location_lng: lng })
    .eq('owner_user_id', user.id)
  if (error) {
    console.error('[org update-location] db error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, lat, lng })
}
