export function extractDefaults(
  args: { name: string; default: string }[]
): Record<string, string> {
  return Object.fromEntries(args.map((a) => [a.name, a.default]));
}

export function compilePrompt(
  content: string,
  values: Record<string, string>
): string {
  return content
    .replace(
      /\{argument\s+name="([^"]+)"\s+default="([^"]*)"\}/g,
      (_full, name: string, def: string) => {
        const v = values[name];
        return v !== undefined && v !== '' ? v : def;
      }
    )
    .replace(/^\s*\n/, '');
}
