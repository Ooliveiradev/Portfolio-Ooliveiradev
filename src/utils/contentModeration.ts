/**
 * Utilitário de Moderação e Sanitização de Conteúdo para Sussurros Cósmicos
 * Previne palavrões, termos ofensivos, spam e ataques de injeção XSS.
 */

const BLOCKED_WORDS = [
  // Termos ofensivos comuns (PT / EN)
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'nigger', 'cunt', 'dick', 'pussy',
  'porra', 'caralho', 'puta', 'filho da puta', 'fdp', 'arrombado', 'merda', 'bosta',
  'otario', 'cuzão', 'viado', 'cacete', 'foda', 'foder', 'desgraçado', 'chupa'
];

export interface ModerationResult {
  isValid: boolean;
  sanitizedAuthor: string;
  sanitizedMessage: string;
  sanitizedOrigin: string;
  errorMessage?: string;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Verifica se o texto contém alguma palavra bloqueada
 */
export function containsProfanity(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos para checagem

  return BLOCKED_WORDS.some((word) => {
    const wordNorm = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regex = new RegExp(`\\b${wordNorm}\\b`, 'i');
    return regex.test(normalized);
  });
}

/**
 * Valida e sanitiza os campos de um sussurro cósmico antes da transmissão
 */
export function validateAndSanitizeWhisper(
  rawAuthor: string,
  rawMessage: string,
  rawOrigin: string = 'Terra'
): ModerationResult {
  const trimmedAuthor = rawAuthor.trim().slice(0, 24);
  const trimmedMessage = rawMessage.trim().slice(0, 140);
  const trimmedOrigin = rawOrigin.trim().slice(0, 32);

  if (!trimmedAuthor) {
    return {
      isValid: false,
      sanitizedAuthor: '',
      sanitizedMessage: '',
      sanitizedOrigin: '',
      errorMessage: 'Por favor, informe seu nome ou codinome de piloto.',
    };
  }

  if (!trimmedMessage) {
    return {
      isValid: false,
      sanitizedAuthor: '',
      sanitizedMessage: '',
      sanitizedOrigin: '',
      errorMessage: 'A mensagem cósmica não pode estar vazia.',
    };
  }

  if (containsProfanity(trimmedAuthor) || containsProfanity(trimmedMessage) || containsProfanity(trimmedOrigin)) {
    return {
      isValid: false,
      sanitizedAuthor: '',
      sanitizedMessage: '',
      sanitizedOrigin: '',
      errorMessage: 'A mensagem contém palavras inapropriadas para o canal estelar público.',
    };
  }

  return {
    isValid: true,
    sanitizedAuthor: escapeHtml(trimmedAuthor),
    sanitizedMessage: escapeHtml(trimmedMessage),
    sanitizedOrigin: escapeHtml(trimmedOrigin || 'Planeta Terra'),
  };
}
