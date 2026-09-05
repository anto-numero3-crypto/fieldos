import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = (await req.json().catch(() => null)) as { description?: string } | null
  if (!body?.description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  const supabase = adminClient()

  // Resolve org
  const { data: org } = await supabase
    .from('organizations')
    .select('id, invoice_default_tps, invoice_default_tvq, invoice_payment_terms')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Fetch products for context
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, unit_price, unit, category, is_service')
    .eq('org_id', org.id)
    .eq('is_active', true)
    .order('usage_count', { ascending: false })
    .limit(100)

  // Fetch customers for context
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, email, phone')
    .eq('user_id', user.id)
    .order('name')
    .limit(200)

  const today = new Date().toISOString().split('T')[0]

  const productList = (products || []).map((p) =>
    `- ${p.name} (ID: ${p.id}, price: ${p.unit_price}, unit: ${p.unit || 'each'}, type: ${p.is_service ? 'service' : 'product'}${p.description ? `, desc: ${p.description}` : ''})`
  ).join('\n')

  const customerList = (customers || []).map((c) =>
    `- ${c.name} (ID: ${c.id}${c.email ? `, email: ${c.email}` : ''}${c.phone ? `, phone: ${c.phone}` : ''})`
  ).join('\n')

  const systemPrompt = `You are an invoice creation assistant. Given a natural language description, extract structured invoice data.

Available products/services:
${productList || '(none)'}

Available customers:
${customerList || '(none)'}

Today's date: ${today}

Return ONLY valid JSON: { "customer_name": string, "customer_id": string|null (if match found), "line_items": [{ "description": string, "quantity": number, "unit": string, "unit_price": number, "product_id": string|null (if match) }], "apply_tps": boolean, "apply_tvq": boolean, "notes": string|null, "payment_terms": string|null }

Rules:
- Match customer names and product names fuzzily (partial matches OK).
- If a product matches, use its unit_price unless the description specifies a different price.
- Default apply_tps and apply_tvq to ${org.invoice_default_tps !== false ? 'true' : 'false'} and ${org.invoice_default_tvq !== false ? 'true' : 'false'} respectively.
- Default payment_terms to "${org.invoice_payment_terms || 'net30'}".
- quantity defaults to 1 if not specified.
- unit defaults to the product's unit or "unit" if not specified.`

  try {
    const anthropic = new Anthropic()

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: body.description.trim() },
      ],
    })

    // Extract text from response
    const textBlock = message.content.find((b) => b.type === 'text')
    const responseText = textBlock ? textBlock.text : ''

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = responseText.trim()
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr)

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    if (parsed.customer_id && parsed.line_items?.length > 0 && parsed.line_items.every((li: { product_id?: string | null }) => li.product_id)) {
      confidence = 'high'
    } else if (!parsed.customer_id && (!parsed.line_items || parsed.line_items.length === 0)) {
      confidence = 'low'
    }

    return NextResponse.json({ invoice: parsed, confidence })
  } catch (err) {
    console.error('[ai-create] error:', err)
    const message = err instanceof Error ? err.message : 'AI processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
