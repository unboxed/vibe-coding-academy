/**
 * Converts HTML from TipTap editor to Markdown for storage
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html === '<p></p>') return ''

  let markdown = html

  // Handle headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')

  // Handle lists - process nested structure
  markdown = processLists(markdown)

  // Handle code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return '```\n' + decodeHtml(code.trim()) + '\n```\n\n'
  })

  // Handle inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

  // Handle bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')

  // Handle italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

  // Handle paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

  // Handle line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')

  // Handle links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

  // Clean up HTML entities
  markdown = decodeHtml(markdown)

  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  markdown = markdown.trim()

  return markdown
}

/**
 * Process HTML lists into markdown format
 */
function processLists(html: string): string {
  // Process unordered lists
  html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
    return items.map((item: string) => {
      const text = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim()
      // Handle nested content
      const cleanText = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1')
      return `- ${cleanText}`
    }).join('\n') + '\n\n'
  })

  // Process ordered lists
  html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
    return items.map((item: string, index: number) => {
      const text = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim()
      // Handle nested content
      const cleanText = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1')
      return `${index + 1}. ${cleanText}`
    }).join('\n') + '\n\n'
  })

  return html
}

/**
 * Decode HTML entities
 */
function decodeHtml(html: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  }

  return html.replace(/&[^;]+;/g, (entity) => entities[entity] || entity)
}

/**
 * Converts Markdown to HTML for TipTap editor
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  let html = markdown

  // Handle code blocks first (to protect their content)
  const codeBlocks: string[] = []
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    const index = codeBlocks.length
    codeBlocks.push(`<pre><code>${encodeHtml(code.trim())}</code></pre>`)
    return `__CODEBLOCK_${index}__`
  })

  // Handle headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Handle unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Handle ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // This is a simplified approach - consecutive numbered items become ol
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('<ul>')) return match // Already processed as ul
    return `<ol>${match}</ol>`
  })

  // Handle inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Handle bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Handle italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Handle links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Handle paragraphs (lines not already wrapped in tags)
  const lines = html.split('\n')
  html = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('<')) return trimmed
    if (trimmed.startsWith('__CODEBLOCK_')) return trimmed
    return `<p>${trimmed}</p>`
  }).join('')

  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODEBLOCK_${index}__`, block)
  })

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')

  return html
}

/**
 * Encode HTML special characters
 */
function encodeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
