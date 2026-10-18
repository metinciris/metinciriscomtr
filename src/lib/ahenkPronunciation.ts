// Leave the translated medical titles unchanged by default. Add ONLY
// confirmed mispronunciations after listening to a real Ahenk output.
// Example: { pattern: /\bSOME-ABBR\b/gi, spoken: 'istenen okunuş' }
const FIXES: ReadonlyArray<{ pattern: RegExp; spoken: string }> = [];

export function prepareAhenkText(title: string): string {
  return FIXES.reduce((value, fix) => value.replace(fix.pattern, fix.spoken), title);
}
