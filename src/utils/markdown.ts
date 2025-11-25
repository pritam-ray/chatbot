export function formatText(text: string) {
  let formatted = text;

  formatted = formatted.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
  formatted = formatted.replace(/~~(.+?)~~/g, '<del>$1</del>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: linear-gradient(to right, #f1f5f9, #e0f2fe); color: #475569; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 0.9em; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">$1</code>');

  return formatted;
}

export function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: any[] = [];
  let codeBlock = '';
  let inCodeBlock = false;
  let codeLanguage = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      } else {
        elements.push({
          type: 'codeblock',
          content: codeBlock.trim(),
          language: codeLanguage,
          key: elements.length,
        });
        codeBlock = '';
        inCodeBlock = false;
        codeLanguage = '';
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlock += line + '\n';
      i++;
      continue;
    }

    if (line.trim() === '') {
      if (elements.length > 0 && elements[elements.length - 1].type !== 'empty') {
        elements.push({
          type: 'empty',
          key: elements.length,
        });
      }
      i++;
      continue;
    }

    if (line.match(/^#{1,6}\s/)) {
      const level = line.match(/^#+/)![0].length;
      const titleContent = line.replace(/^#+\s/, '').trim();
      elements.push({
        type: 'heading',
        level,
        content: titleContent,
        key: elements.length,
      });
      i++;
      continue;
    }

    if (line.match(/^\*\s\*\s\*/) || line.match(/^---+/) || line.match(/^\*\*\*+/)) {
      elements.push({
        type: 'divider',
        key: elements.length,
      });
      i++;
      continue;
    }

    if (line.match(/^\s*[-*+]\s+/) && !line.startsWith('  ')) {
      const itemContent = line.replace(/^\s*[-*+]\s+/, '').trim();
      elements.push({
        type: 'bullet',
        content: itemContent,
        key: elements.length,
      });
      i++;
      continue;
    }

    if (line.match(/^\s*\d+\.\s+/)) {
      const match = line.match(/^\s*(\d+)\.\s+(.+)$/);
      if (match) {
        elements.push({
          type: 'numbered',
          number: match[1],
          content: match[2],
          key: elements.length,
        });
      }
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteContent = line.replace(/^>\s+/, '').trim();
      elements.push({
        type: 'blockquote',
        content: quoteContent,
        key: elements.length,
      });
      i++;
      continue;
    }

    elements.push({
      type: 'paragraph',
      content: line,
      key: elements.length,
    });
    i++;
  }

  return elements;
}
