export const lookingForLimit = 140;

export function teamSearchText(name: string, lookingFor: string) {
  return [name, lookingFor].filter(Boolean).join(" ");
}

export function legacyLookingFor(roles?: string[]) {
  const joined = roles?.join(", ").trim() ?? "";
  return joined.length <= lookingForLimit
    ? joined
    : `${joined.slice(0, lookingForLimit - 1).trimEnd()}…`;
}
