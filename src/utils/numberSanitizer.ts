/**
 * Sanitiza e formata um número de telefone para o padrão de disparos do WhatsApp.
 * Remove caracteres especiais, insere o código do país (55) e realiza correções de DDD/9º dígito.
 */
export function sanitizeWhatsAppNumber(num: string): string | null {
  if (!num) return null;
  
  // Remove tudo que não for dígito
  let clean = num.replace(/\D/g, '');
  if (!clean) return null;
  
  // Caso o usuário insira o sinal + na frente e tenha DDI (ex: 5511999999999)
  // Se já começar com o código do Brasil (55) e tiver o tamanho correto (12 ou 13 dígitos), já está perfeito
  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
    return clean;
  }
  
  // Se o número tiver 8 ou 9 dígitos (falta DDD e DDI), adicionamos o DDD 11 (SP) como fallback seguro
  if (clean.length === 8 || clean.length === 9) {
    clean = '11' + clean;
  }
  
  // Se o número tiver 10 ou 11 dígitos (tem DDD, mas falta DDI), adicionamos o 55 (Brasil)
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  
  // Retorna se tiver um tamanho aceitável para disparo
  if (clean.length >= 10 && clean.length <= 15) {
    return clean;
  }
  
  return null;
}
