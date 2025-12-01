declare module 'marked-emoji' {
  interface MarkedEmojiOptions {
    emojis?: Record<string, string>;
    unicode?: boolean;
  }
  
  export function markedEmoji(options?: MarkedEmojiOptions): any;
}

declare module 'marked-footnote' {
  export default function markedFootnote(options?: any): any;
}
