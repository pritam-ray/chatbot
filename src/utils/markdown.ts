import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

// Custom renderer for better control
const renderer = new marked.Renderer();

// Override code rendering to add custom classes
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  return `<pre class="code-block" data-language="${lang || ''}"><code>${text}</code></pre>`;
};

// Override table rendering for custom styling
renderer.table = (token: any) => {
  return `<div class="table-wrapper"><table class="markdown-table"><thead>${token.header}</thead><tbody>${token.rows}</tbody></table></div>`;
};

marked.use({ renderer });

// Process math expressions in markdown
function processMathExpressions(text: string): string {
  const mathExpressions: Array<{ type: 'inline' | 'display'; expr: string }> = [];
  const mathPlaceholder = '___MATH_EXPR___';
  
  let processed = text;
  
  // Handle display math ($$...$$) - must be on separate lines or with line breaks
  processed = processed.replace(/\$\$([^\$]+?)\$\$/gs, (_match, expr) => {
    mathExpressions.push({ type: 'display', expr: expr.trim() });
    return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
  });
  
  // Handle inline math ($...$) - not crossing line boundaries
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, expr) => {
    mathExpressions.push({ type: 'inline', expr: expr.trim() });
    return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
  });

  return { processed, mathExpressions } as any;
}

function restoreMathExpressions(html: string, mathExpressions: Array<{ type: 'inline' | 'display'; expr: string }>): string {
  const mathPlaceholder = '___MATH_EXPR___';
  
  return html.replace(new RegExp(`${mathPlaceholder}(\\d+)${mathPlaceholder}`, 'g'), (_match, index) => {
    const { type, expr } = mathExpressions[parseInt(index)];
    try {
      const rendered = katex.renderToString(expr, {
        displayMode: type === 'display',
        throwOnError: false,
        output: 'html',
        strict: false,
        trust: false,
      });
      
      if (type === 'display') {
        return `<div class="math-display">${rendered}</div>`;
      } else {
        return `<span class="math-inline">${rendered}</span>`;
      }
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      // Return original expression if rendering fails
      return type === 'display' ? `<div class="math-error">$$${expr}$$</div>` : `<span class="math-error">$${expr}$</span>`;
    }
  });
}

// Main function to render markdown with math support
export function renderMarkdownToHTML(content: string): string {
  try {
    // Process math expressions first
    const { processed, mathExpressions } = processMathExpressions(content) as any;
    
    // Parse markdown
    let html = marked.parse(processed) as string;
    
    // Restore math expressions
    html = restoreMathExpressions(html, mathExpressions);
    
    // Sanitize HTML
    const clean = DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'annotation'],
      ADD_ATTR: ['class', 'style', 'data-language'],
      ALLOWED_TAGS: [
        'a', 'b', 'strong', 'i', 'em', 'u', 'strike', 'del', 's', 'code', 'pre',
        'p', 'br', 'span', 'div', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'img', 'sup', 'sub',
        // KaTeX elements
        'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'annotation'
      ],
      ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title', 'data-language', 'colspan', 'rowspan'],
    });
    
    return clean;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return `<p>${content}</p>`;
  }
}


