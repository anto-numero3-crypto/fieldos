import Link from 'next/link'

// Very small Markdown-lite renderer for the in-repo blog content.
// Supports: ## H2, ### H3, **bold**, inline [links](url), bullet lists (- item).
// For anything richer, move to MDX.

interface Props { source: string }

export default function MarkdownLite({ source }: Props) {
  const lines = source.trim().split('\n')
  const blocks: Array<{ type: 'h2' | 'h3' | 'p' | 'ul'; items: string[] }> = []
  let current: { type: 'h2' | 'h3' | 'p' | 'ul'; items: string[] } | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { current = null; continue }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', items: [line.slice(3)] })
      current = null
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', items: [line.slice(4)] })
      current = null
    } else if (line.startsWith('- ')) {
      if (!current || current.type !== 'ul') {
        current = { type: 'ul', items: [] }
        blocks.push(current)
      }
      current.items.push(line.slice(2))
    } else {
      if (!current || current.type !== 'p') {
        current = { type: 'p', items: [] }
        blocks.push(current)
      }
      current.items.push(line)
    }
  }

  return (
    <div className="prose prose-slate max-w-none">
      {blocks.map((b, i) => {
        if (b.type === 'h2') {
          const id = slugify(b.items[0])
          return <h2 key={i} id={id} className="text-2xl font-bold text-gray-900 mt-10 mb-4 scroll-mt-24">{b.items[0]}</h2>
        }
        if (b.type === 'h3') {
          return <h3 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-2">{b.items[0]}</h3>
        }
        if (b.type === 'ul') {
          return (
            <ul key={i} className="list-disc pl-6 mb-5 space-y-1.5 text-gray-700">
              {b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
            </ul>
          )
        }
        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-4">
            {b.items.map((t, j) => <span key={j}>{renderInline(t)}{j < b.items.length - 1 ? ' ' : ''}</span>)}
          </p>
        )
      })}
    </div>
  )
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function renderInline(text: string): React.ReactNode {
  // Parse **bold** and [text](url) in sequence
  const nodes: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length) {
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/)
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/)
    // Pick whichever comes first
    let next: 'link' | 'bold' | null = null
    if (linkMatch && boldMatch) {
      next = (linkMatch[1].length <= boldMatch[1].length) ? 'link' : 'bold'
    } else if (linkMatch) next = 'link'
    else if (boldMatch) next = 'bold'

    if (next === 'link' && linkMatch) {
      if (linkMatch[1]) nodes.push(<span key={key++}>{linkMatch[1]}</span>)
      const href = linkMatch[3]
      const label = linkMatch[2]
      const isExternal = /^https?:/.test(href)
      nodes.push(
        isExternal
          ? <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{label}</a>
          : <Link key={key++} href={href} className="text-indigo-600 hover:underline">{label}</Link>
      )
      remaining = linkMatch[4]
    } else if (next === 'bold' && boldMatch) {
      if (boldMatch[1]) nodes.push(<span key={key++}>{boldMatch[1]}</span>)
      nodes.push(<strong key={key++} className="font-semibold text-gray-900">{boldMatch[2]}</strong>)
      remaining = boldMatch[3]
    } else {
      nodes.push(<span key={key++}>{remaining}</span>)
      remaining = ''
    }
  }
  return nodes
}
