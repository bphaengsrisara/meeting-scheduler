// A LIKE pattern that matches the text anywhere. %, _ and \ in the text are
// escaped, so a search for "50%" finds "50%" and not "500".
export function containsPattern(text: string) {
  const escaped = text.replaceAll(/[\\%_]/g, (char) => "\\" + char);
  return `%${escaped}%`;
}
