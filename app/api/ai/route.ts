import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  const { message, userId } = await req.json()

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, customers(name)')
    .eq('user_id', userId)

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customers(name)')
    .eq('user_id', userId)

  const totalInvoiced = invoices?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0
  const unpaidInvoices = invoices?.filter(inv => inv.status === 'unpaid') || []
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || []
  const scheduledJobs = jobs?.filter(j => j.status === 'scheduled') || []
  const completedJobs = jobs?.filter(j => j.status === 'complete') || []

  const systemPrompt = `You are FieldOS Assistant, an AI co-pilot for a field service business.

Here is the current business data:

CUSTOMERS (${customers?.length || 0} total):
${customers?.map(c => `- ${c.name} | ${c.email || 'no email'} | ${c.phone || 'no phone'}`).join('\n') || 'No customers yet'}

JOBS (${jobs?.length || 0} total):
- Scheduled: ${scheduledJobs.length}
- Completed: ${completedJobs.length}
${jobs?.map(j => `- ${j.title} | Customer: ${j.customers?.name || 'none'} | Status: ${j.status} | Date: ${j.scheduled_date || 'no date'}`).join('\n') || 'No jobs yet'}

INVOICES (${invoices?.length || 0} total):
- Total invoiced: $${totalInvoiced.toFixed(2)}
- Unpaid: ${unpaidInvoices.length} invoices
- Paid: ${paidInvoices.length} invoices
${invoices?.map(inv => `- $${parseFloat(inv.amount).toFixed(2)} | Customer: ${inv.customers?.name || 'none'} | Status: ${inv.status} | Due: ${inv.due_date || 'no date'}`).join('\n') || 'No invoices yet'}

Rules:
- Only answer based on the data above
- Be concise and helpful
- If asked to do something you cannot do, explain what the user can do manually
- Always be friendly and professional`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''

  return Response.json({ reply })
}