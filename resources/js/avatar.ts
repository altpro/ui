// A person's avatar without a photo: their initials, on a hue that is theirs on every screen. UserAvatar.vue draws it;
// the functions are here for anything else that names a person, such as a user menu's "SR, user menu".

const hues = ["blue", "emerald", "violet", "amber", "rose", "teal", "indigo", "orange", "cyan", "fuchsia", "lime", "pink"] as const;

/** One of the `.avatar` hue words, from the name: the same person gets the same colour on every screen. */
export type AvatarHue = (typeof hues)[number];

export const avatarHue = (name: string): AvatarHue => {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  return hues[hash % hues.length]!;
};

/** The first letters of the first and last names, upper case: "Sam Taylor" is "ST", "Cher" is "C". */
export const getInitials = (fullName?: string | null): string => {
  const names = (fullName ?? "").trim().split(/\s+/u).filter(Boolean);
  const first = (name: string | undefined) => Array.from(name ?? "")[0] ?? "";
  if (names.length === 0) return "";
  return (names.length === 1 ? first(names[0]) : first(names[0]) + first(names.at(-1))).toUpperCase();
};
