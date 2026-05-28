export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export type AccountProfile = {
  username: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
};

type AuthUser = {
  user_metadata?: {
    harvestly_username?: unknown;
    avatar_url?: unknown;
  } | null;
} | null;

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

export function profileSetupPath(destination: string) {
  return `/complete-profile?next=${encodeURIComponent(destination)}`;
}

export function readAccountProfile(user: AuthUser): AccountProfile {
  const metadata = user?.user_metadata;
  const username = typeof metadata?.harvestly_username === "string" ? normalizeUsername(metadata.harvestly_username) : null;
  return {
    username: username && isValidUsername(username) ? username : null,
    avatarUrl: typeof metadata?.avatar_url === "string" ? metadata.avatar_url : null,
    profileComplete: Boolean(username && isValidUsername(username)),
  };
}

export function readDatabaseAccountProfile(row: ProfileRow, user?: AuthUser): AccountProfile {
  const username = typeof row?.username === "string" ? normalizeUsername(row.username) : null;
  const avatarUrl = typeof row?.avatar_url === "string"
    ? row.avatar_url
    : (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null);

  return {
    username: username && isValidUsername(username) ? username : null,
    avatarUrl,
    profileComplete: Boolean(username && isValidUsername(username)),
  };
}
