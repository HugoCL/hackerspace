export const lookingForLimit = 140;

export function teamSearchText(name: string, lookingFor: string) {
  return [name, lookingFor].filter(Boolean).join(" ");
}

export function legacyLookingFor(roles?: string[]) {
  const joined = roles?.join(", ").trim() ?? "";
  if (joined.length <= lookingForLimit)
    return { text: joined, truncated: false };
  const excerpt = joined
    .slice(0, lookingForLimit - 1)
    .replace(/[\uD800-\uDBFF]$/u, "")
    .trimEnd();
  return { text: `${excerpt}…`, truncated: true };
}
