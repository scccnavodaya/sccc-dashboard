// simple password strength helpers

export function passwordStrengthScore(pw: string): number {
  if (!pw) return 0;

  let score = 0;

  // Length: short, medium, long
  if (pw.length >= 12) score += 2;
  else if (pw.length >= 8) score += 1;

  // Variety of characters
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++; // check lowercase too
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  // Max score = 6
  return Math.min(score, 6);
}

export function passwordStrengthLabel(score: number): string {
  switch (score) {
    case 6: return "Excellent";
    case 5: return "Strong";
    case 4: return "Good";
    case 3: return "Fair";
    case 2: return "Weak";
    case 1: return "Very weak";
    default: return "Too short";
  }
}
