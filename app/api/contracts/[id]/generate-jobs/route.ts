import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { calculateRecurringDates } from '@/lib/recurring-dates'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const supabase = adminClient()

  // Verify org ownership
  const { data: org } = await supabase
    .from('organizations')
    .select('id, owner_user_id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  // Fetch contract
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.id)
    .maybeSingle()

  if (cErr || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  if (!['approved', 'active'].includes(contract.status)) {
    return NextResponse.json(
      { error: 'Contract must be approved or active to generate jobs' },
      { status: 400 },
    )
  }

  // Calculate all recurring dates
  const dates = contract.recurrence_type === 'none'
    ? [contract.start_date]
    : calculateRecurringDates(
        contract.start_date,
        contract.end_date,
        contract.recurrence_type,
        contract.recurrence_days || [],
      )

  // Check existing jobs for this contract
  const { data: existingJobs } = await supabase
    .from('jobs')
    .select('scheduled_date')
    .eq('contract_id', id)

  const existingDates = new Set(
    (existingJobs || []).map((j: { scheduled_date: string }) => j.scheduled_date),
  )

  // Insert new jobs
  const toInsert = dates
    .filter((d) => !existingDates.has(d))
    .map((d) => ({
      user_id: org.owner_user_id,
      customer_id: contract.customer_id,
      title: contract.service_name,
      description: contract.service_description || '',
      scheduled_date: d,
      contract_id: id,
      is_recurring: true,
      status: 'scheduled',
    }))

  let generated = 0
  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from('jobs').insert(toInsert)
    if (insertErr) {
      console.error('[generate-jobs] insert failed:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
    generated = toInsert.length
  }

  // Update contract metadata
  const lastDate = dates[dates.length - 1] || null
  const futureDate = dates.find(
    (d) => new Date(d + 'T12:00:00') > new Date(),
  ) || null

  const updates: Record<string, unknown> = {
    jobs_generated_count: (contract.jobs_generated_count || 0) + generated,
    last_job_generated_at: new Date().toISOString(),
    next_job_date: futureDate,
  }
  if (contract.status === 'approved') {
    updates.status = 'active'
  }

  await supabase.from('contracts').update(updates).eq('id', id)

  // Notify owner
  if (generated > 0) {
    try {
      await supabase.from('notifications').insert({
        user_id: org.owner_user_id,
        type: 'success',
        title: `${generated} interventions générées`,
        body: `Les interventions du contrat ${contract.title || contract.service_name} ont été créées dans votre calendrier.`,
        link: `/contrats/${id}`,
      })    } catch (_) { /* non-blocking */ }
  }

  return NextResponse.json({
    generated,
    skipped: existingDates.size,
    total: dates.length,
  })
}
