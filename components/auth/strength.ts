// simple password strength helpers

export function passwordStrengthScore(pw: string): number {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

export function passwordStrengthLabel(score: number): string {
  switch (score) {
    case 4: return "Strong";
    case 3: return "Okay";
    case 2: return "Weak";
    case 1: return "Very weak";
    default: return "Too short";
  }
}
