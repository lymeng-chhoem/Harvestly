export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const PROFILE_AVATAR_MAX_SIZE = 2 * 1024 * 1024;
export const PROFILE_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AccountProfile = {
  username: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
};

type ProfileRow = {
  username?: unknown;
  avatar_url?: unknown;
} | null;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(value);
}

export function profileAvatarExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return null;
}

export function profileSetupPath(destination: string) {
  return `/complete-profile?next=${encodeURIComponent(destination)}`;
}

export function readDatabaseAccountProfile(row: ProfileRow): AccountProfile {
  const databaseUsername = typeof row?.username === "string" ? normalizeUsername(row.username) : null;
  const username = databaseUsername && isValidUsername(databaseUsername) ? databaseUsername : null;
  const avatarUrl = typeof row?.avatar_url === "string" ? row.avatar_url : null;

  return {
    username: username && isValidUsername(username) ? username : null,
    avatarUrl,
    profileComplete: Boolean(username && isValidUsername(username)),
  };
}
