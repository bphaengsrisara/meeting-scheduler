// Avatar letters: the first letters of the first and last word of the name,
// or the first letter of the email when there is no name.
export function initials(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.length > 1 ? words.at(-1) : undefined;
  if (!first) {
    return email.charAt(0).toUpperCase();
  }
  return `${first.charAt(0)}${last?.charAt(0) ?? ""}`.toUpperCase();
}
