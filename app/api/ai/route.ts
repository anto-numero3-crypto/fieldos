import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: 'AI is not configured. Add ANTHROPIC_API_KEY to environment.' }, { status: 503 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase  = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { message, userId, history = [], pageContext, mode } = await req.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 })
    }

    // Fetch business data for context
    const [
      { data: customers, count: customerCount },
      { data: jobs },
      { data: invoices },
      { data: quotes },
    ] = await Promise.all([
      supabase.from('customers').select('id, name, email, phone, tags, lifetime_value, created_at', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('jobs').select('id, title, status, priority, scheduled_date, created_at, customers(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('invoices').select('id, amount, status, due_date, created_at, invoice_number, customers(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('quotes').select('id, title, status, total, created_at, customers(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    ])

    // Compute business metrics
    const allInvoices = invoices || []
    const allJobs     = jobs || []

    const totalRevenue    = allInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const paidRevenue     = allInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const unpaidRevenue   = allInvoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const overdueRevenue  = allInvoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const overdueInvoices = allInvoices.filter((i) => i.status === 'overdue')
    const unpaidInvoices  = allInvoices.filter((i) => i.status === 'unpaid')
    const activeJobs      = allJobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress')
    const completedJobs   = allJobs.filter((j) => j.status === 'complete')

    // Monthly revenue breakdown (last 6 months)
    const monthlyRevenue: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlyRevenue[d.toLocaleDateString('en', { month: 'short', year: 'numeric' })] = 0
    }
    allInvoices.forEach((inv) => {
      const key = new Date(inv.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })
      if (key in monthlyRevenue) monthlyRevenue[key] += parseFloat(String(inv.amount))
    })

    const businessContext = `
## FieldOS Business Data

**Overview:**
- Customers: ${customerCount || 0}
- Jobs: ${allJobs.length} total (${activeJobs.length} active, ${completedJobs.length} completed)
- Total Revenue (all time): $${totalRevenue.toFixed(2)}
- Collected: $${paidRevenue.toFixed(2)} (${totalRevenue > 0 ? (paidRevenue / totalRevenue * 100).toFixed(1) : 0}% collection rate)
- Outstanding: $${unpaidRevenue.toFixed(2)} (${unpaidInvoices.length} invoices)
- Overdue: $${overdueRevenue.toFixed(2)} (${overdueInvoices.length} invoices)

**Customers (recent 10):**
${(customers || []).slice(0, 10).map((c) => `- ${c.name}${c.email ? ` <${c.email}>` : ''}${c.phone ? ` · ${c.phone}` : ''}${(c.tags as string[]|null)?.length ? ` [${(c.tags as string[]).join(', ')}]` : ''}`).join('\n')}

**Jobs (recent 15):**
${allJobs.slice(0, 15).map((j) => `- [${j.status}] "${j.title}" — ${(j.customers as unknown as {name:string}|null)?.name || 'No customer'}${j.scheduled_date ? ` on ${j.scheduled_date}` : ''}${j.priority && j.priority !== 'normal' ? ` (${j.priority})` : ''}`).join('\n')}

**Invoices (recent 15):**
${allInvoices.slice(0, 15).map((i) => `- [${i.status}] $${parseFloat(String(i.amount)).toFixed(2)} — ${(i.customers as unknown as {name:string}|null)?.name || 'Unknown'}${i.due_date ? ` due ${i.due_date}` : ''}${i.invoice_number ? ` (${i.invoice_number})` : ''}`).join('\n')}

**Quotes:**
${(quotes || []).map((q) => `- [${q.status}] "${q.title}" $${(q.total || 0).toFixed(2)} — ${(q.customers as unknown as {name:string}|null)?.name || 'Unknown'}`).join('\n') || '(none)'}

**Monthly Revenue (last 6 months):**
${Object.entries(monthlyRevenue).map(([m, r]) => `- ${m}: $${r.toFixed(2)}`).join('\n') || '(no data)'}

**Overdue invoices needing follow-up:**
${overdueInvoices.slice(0, 5).map((i) => `- $${parseFloat(String(i.amount)).toFixed(2)} from ${(i.customers as unknown as {name:string}|null)?.name || 'Unknown'} (due ${i.due_date})`).join('\n') || '(none)'}
`.trim()

    const isFloating = mode === 'floating'
    const pageCtx = pageContext ? `\n\n**Current page context:** ${pageContext}` : ''

    const systemPrompt = `You are FieldOS AI — an expert business assistant for a field service management platform (Jobber / ServiceTitan level intelligence).

${businessContext}${pageCtx}

## Your role:
Answer questions, provide insights, draft communications, and help the business owner make better decisions based on their real data.

## What you can do:
- Answer questions about customers, jobs, invoices, revenue with specific numbers from the data above
- Draft professional follow-up emails for overdue invoices
- Identify customers at churn risk (inactive for 90+ days)
- Suggest optimal pricing based on job history
- Generate weekly/monthly business summaries
- Flag anomalies: unusual patterns, underbilling, pricing inconsistencies
- Recommend upsell opportunities
- Analyze cash flow and AR aging

## Response style:
${isFloating ? '- CONCISE: Keep responses under 150 words for the floating chat. Use bullet points.\n- Be direct and actionable.' : '- Detailed when helpful, concise when possible.\n- Use bullet points and formatting.'}
- Use specific numbers from the business data
- Format currency as $X.XX
- When drafting emails/documents, write them ready-to-use
- Today: ${new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

    // Multi-turn conversation history
    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isFloating ? 400 : 1500,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I could not generate a response.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('AI route error:', err)
    return NextResponse.json({ reply: 'Something went wrong. Please try again.', error: String(err) }, { status: 500 })
  }
}
