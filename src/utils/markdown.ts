import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import { markedEmoji } from 'marked-emoji';
import markedFootnote from 'marked-footnote';

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

// Add emoji support
marked.use(markedEmoji({
  emojis: {
    smile: '😄',
    laughing: '😆',
    blush: '😊',
    heart: '❤️',
    heart_eyes: '😍',
    kissing_heart: '😘',
    relaxed: '☺️',
    grin: '😁',
    wink: '😉',
    stuck_out_tongue_winking_eye: '😜',
    stuck_out_tongue: '😛',
    sleeping: '😴',
    worried: '😟',
    expressionless: '😑',
    sweat: '😓',
    cold_sweat: '😰',
    joy: '😂',
    sob: '😭',
    angry: '😠',
    rage: '😡',
    triumph: '😤',
    sleepy: '😪',
    yum: '😋',
    mask: '😷',
    sunglasses: '😎',
    dizzy_face: '😵',
    imp: '👿',
    smiling_imp: '😈',
    neutral_face: '😐',
    no_mouth: '😶',
    innocent: '😇',
    alien: '👽',
    yellow_heart: '💛',
    blue_heart: '💙',
    purple_heart: '💜',
    green_heart: '💚',
    broken_heart: '💔',
    heartbeat: '💓',
    heartpulse: '💗',
    two_hearts: '💕',
    revolving_hearts: '💞',
    cupid: '💘',
    sparkling_heart: '💖',
    sparkles: '✨',
    star: '⭐',
    star2: '🌟',
    dizzy: '💫',
    boom: '💥',
    collision: '💥',
    anger: '💢',
    exclamation: '❗',
    question: '❓',
    grey_exclamation: '❕',
    grey_question: '❔',
    zzz: '💤',
    dash: '💨',
    sweat_drops: '💦',
    notes: '🎶',
    musical_note: '🎵',
    fire: '🔥',
    hankey: '💩',
    poop: '💩',
    shit: '💩',
    '+1': '👍',
    thumbsup: '👍',
    '-1': '👎',
    thumbsdown: '👎',
    ok_hand: '👌',
    punch: '👊',
    facepunch: '👊',
    fist: '✊',
    v: '✌️',
    wave: '👋',
    hand: '✋',
    raised_hand: '✋',
    open_hands: '👐',
    point_up: '☝️',
    point_down: '👇',
    point_left: '👈',
    point_right: '👉',
    raised_hands: '🙌',
    pray: '🙏',
    point_up_2: '👆',
    clap: '👏',
    muscle: '💪',
    rocket: '🚀',
    tada: '🎉',
    thought_balloon: '💭',
    speech_balloon: '💬',
    checkmark: '✓',
    x: '❌',
    warning: '⚠️',
    zap: '⚡',
    bulb: '💡',
    bell: '🔔',
    no_bell: '🔕',
    mag: '🔍',
    mag_right: '🔎',
    lock: '🔒',
    unlock: '🔓',
    key: '🔑',
    gift: '🎁',
    christmas_tree: '🎄',
    santa: '🎅',
    snowman: '⛄',
    cloud: '☁️',
    umbrella: '☔',
    coffee: '☕',
    cake: '🍰',
    beer: '🍺',
    beers: '🍻',
    computer: '💻',
    iphone: '📱',
    calling: '📲',
    memo: '📝',
    book: '📖',
    books: '📚',
    email: '📧',
    inbox_tray: '📥',
    outbox_tray: '📦',
    camera: '📷',
    video_camera: '📹',
    tv: '📺',
    moneybag: '💰',
    dollar: '💵',
    euro: '💶',
    pound: '💷',
    yen: '💴',
    chart: '💹',
    date: '📅',
    calendar: '📆',
    hourglass: '⌛',
    watch: '⌚',
    alarm_clock: '⏰',
  },
  unicode: false,
}));

// Add footnote support
marked.use(markedFootnote());

// Custom renderer for better control
const renderer = new marked.Renderer();

// Override code rendering to add custom classes
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  return `<pre class="code-block" data-language="${lang || ''}"><code>${text}</code></pre>`;
};

// Override table rendering for custom styling
renderer.table = (token: any) => {
  const header = `<tr>${token.header.map((cell: any) => `<th>${cell.text}</th>`).join('')}</tr>`;
  const rows = token.rows.map((row: any) => 
    `<tr>${row.map((cell: any) => `<td>${cell.text}</td>`).join('')}</tr>`
  ).join('');
  return `<div class="table-wrapper"><table class="markdown-table"><thead>${header}</thead><tbody>${rows}</tbody></table></div>`;
};

// Override image rendering for better styling and security
renderer.image = ({ href, title, text }: { href: string; title: string | null; text: string }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : ' alt="Image"';
  return `<div class="markdown-image-wrapper"><img src="${href}"${altAttr}${titleAttr} class="markdown-image" loading="lazy" /></div>`;
};

marked.use({ renderer });

// Process math expressions in markdown
function processMathExpressions(text: string): string {
  const mathExpressions: Array<{ type: 'inline' | 'display'; expr: string }> = [];
  const mathPlaceholder = 'MATHEXPRESSIONPLACEHOLDER';
  
  let processed = text;
  
  // Handle display math with \[...\] (LaTeX style)
  processed = processed.replace(/\\\[([^\]]+?)\\\]/gs, (_match, expr) => {
    mathExpressions.push({ type: 'display', expr: expr.trim() });
    return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
  });
  
  // Handle display math with [newline]...[newline] (bracket notation on separate lines)
  processed = processed.replace(/^\[\s*\n([\s\S]+?)\n\s*\]$/gm, (_match, expr) => {
    mathExpressions.push({ type: 'display', expr: expr.trim() });
    return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
  });
  
  // Handle display math ($$...$$) - must be on separate lines or with line breaks
  processed = processed.replace(/\$\$([^\$]+?)\$\$/gs, (_match, expr) => {
    mathExpressions.push({ type: 'display', expr: expr.trim() });
    return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
  });
  
  // Handle inline math with \(...\) (LaTeX style)
  processed = processed.replace(/\\\(([^\)]+?)\\\)/g, (_match, expr) => {
    mathExpressions.push({ type: 'inline', expr: expr.trim() });
    return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
  });
  
  // Handle inline math with (variable_name) patterns (common in text explanations)
  // Only match if it contains LaTeX-like syntax (backslash, subscript, superscript, etc.)
  processed = processed.replace(/\(([^)]*[_^\\{}][^)]*)\)/g, (match, expr) => {
    // Check if it looks like math (has LaTeX syntax)
    if (/[_^\\{}]|\\text|\\frac|\\times|\\cdot/.test(expr)) {
      mathExpressions.push({ type: 'inline', expr: expr.trim() });
      return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
    }
    return match; // Not math, keep as-is
  });
  
  // Handle inline math ($...$) - not crossing line boundaries
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, expr) => {
    mathExpressions.push({ type: 'inline', expr: expr.trim() });
    return `${mathPlaceholder}${mathExpressions.length - 1}${mathPlaceholder}`;
  });

  return { processed, mathExpressions } as any;
}

function restoreMathExpressions(html: string, mathExpressions: Array<{ type: 'inline' | 'display'; expr: string }>): string {
  const mathPlaceholder = 'MATHEXPRESSIONPLACEHOLDER';
  
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

// Preprocess content to fix common AI markdown issues
function preprocessMarkdown(text: string): string {
  let processed = text;
  
  // Fix broken image syntax: ![alt text]\nhttps://url -> ![alt text](https://url)
  processed = processed.replace(/!\[([^\]]+)\]\s*\n\s*(https?:\/\/[^\s]+)/gi, '![$1]($2)');
  
  // Fix bare image URLs with descriptions on previous line
  processed = processed.replace(/\[([^\]]+)\]\s*\n\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi, '![$1]($2)');
  
  // Convert standalone image URLs to markdown images (only if they look like images)
  processed = processed.replace(/^(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))(\s|$)/gim, '![]($1)$3');
  
  // Fix images where URL is on same line but with extra text
  processed = processed.replace(/!\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/gi, '![$1]($2)');
  
  return processed;
}

// Main function to render markdown with math support
export function renderMarkdownToHTML(content: string): string {
  try {
    // Preprocess to fix common markdown issues
    let processed = preprocessMarkdown(content);
    
    // Process math expressions
    const { processed: mathProcessed, mathExpressions } = processMathExpressions(processed) as any;
    
    // Parse markdown
    let html = marked.parse(mathProcessed) as string;
    
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
      ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title', 'data-language', 'colspan', 'rowspan', 'loading', 'width', 'height'],
    });
    
    return clean;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return `<p>${content}</p>`;
  }
}


