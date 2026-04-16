'use client';

export function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) =>
    `<pre class="bg-stone-900 text-amber-50 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono leading-relaxed">${code.trim()}</pre>`
  );

  // Tables
  html = html.replace(/(^\|.+\|[\r\n]+\|[-:\s|]+\|[\r\n]+(?:\|.+\|[\r\n]*)+)/gm, (table) => {
    const rows = table.trim().split('\n');
    const header = rows[0].split('|').slice(1, -1).map((c) => c.trim());
    const bodyRows = rows.slice(2).map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
    let out = '<div class="overflow-x-auto my-5 border border-stone-300 rounded-lg"><table class="w-full text-sm">';
    out += '<thead class="bg-stone-100"><tr>';
    header.forEach((h) => {
      out += `<th class="px-4 py-3 text-left font-semibold text-stone-800 border-b border-stone-300">${h}</th>`;
    });
    out += '</tr></thead><tbody>';
    bodyRows.forEach((row, i) => {
      out += `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'} hover:bg-amber-50/40 transition-colors">`;
      row.forEach((c) => {
        out += `<td class="px-4 py-3 border-b border-stone-200 text-stone-700 align-top">${c}</td>`;
      });
      out += '</tr>';
    });
    out += '</tbody></table></div>';
    return out;
  });

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold mt-5 mb-2 text-stone-800 font-display">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-stone-900 font-display">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mt-8 mb-4 text-stone-900 font-display border-b border-stone-200 pb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4 text-stone-900 font-display">$1</h1>');

  // HR
  html = html.replace(/^---+$/gm, '<hr class="my-6 border-stone-300"/>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-stone-900">$1</strong>');
  html = html.replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<em class="italic">$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-amber-700 pl-4 italic text-stone-700 my-3">$1</blockquote>');

  // Ordered lists
  html = html.replace(/(?:^\d+\.\s.+(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^\d+\.\s+/, ''));
    return '<ol class="list-decimal ml-6 my-3 space-y-1 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ol>';
  });

  // Unordered lists
  html = html.replace(/(?:^[-*]\s.+(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^[-*]\s+/, ''));
    return '<ul class="list-disc ml-6 my-3 space-y-1 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
  });

  // Paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks.map((b) => {
    const trimmed = b.trim();
    if (!trimmed) return '';
    if (trimmed.match(/^<(h\d|ul|ol|table|div|pre|blockquote|hr)/)) return trimmed;
    return `<p class="my-3 text-stone-700 leading-relaxed">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div
      className="font-body"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
