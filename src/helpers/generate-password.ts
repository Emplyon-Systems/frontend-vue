/** Senha aleatória com maiúsculas, minúsculas, números e símbolos (mín. 8 caracteres para validações típicas). */
export function generateSecureRandomPassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = `${upper}${lower}${numbers}${symbols}`;
  const randomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const passwordChars = [randomChar(upper), randomChar(lower), randomChar(numbers), randomChar(symbols)];
  for (let i = passwordChars.length; i < length; i += 1) passwordChars.push(randomChar(all));
  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}
