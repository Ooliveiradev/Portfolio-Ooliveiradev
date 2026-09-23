export interface CodeToken { text: string; kind: 'plain' | 'comment' | 'string' | 'keyword' | 'number' }

/** Small lexical highlighter, not a parser. React escapes all source text. */
export function tokenizeCode(line: string): CodeToken[] {
  const pattern = /(\/\/.*$|#.*$|--\s.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b(?:const|let|var|function|return|import|from|export|default|async|await|if|else|for|while|class|new|true|false|null|undefined|def|print|SELECT|FROM|WHERE|CREATE|TABLE|INSERT|INTO|VALUES|npm|npx|git|cd|pip|python|node)\b|\b\d+(?:\.\d+)?\b)/g;
  return line.split(pattern).filter(Boolean).map(text => ({ text, kind:
    /^(\/\/|#|--\s)/.test(text) ? 'comment' : /^["'`]/.test(text) ? 'string' :
      /^\d/.test(text) ? 'number' : /^(?:const|let|var|function|return|import|from|export|default|async|await|if|else|for|while|class|new|true|false|null|undefined|def|print|SELECT|FROM|WHERE|CREATE|TABLE|INSERT|INTO|VALUES|npm|npx|git|cd|pip|python|node)$/.test(text) ? 'keyword' : 'plain',
  }));
}
