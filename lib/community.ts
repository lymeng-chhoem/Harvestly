import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createStoredScanRecord, type CropId, type RiskLevel, type StoredScanRecord } from "@/lib/harvestly-content";
import { registeredScanState } from "@/lib/account-scan-state";
import { isValidUsername, normalizeUsername, readAccountProfile } from "@/lib/profile";

export const COMMUNITY_POST_LIMIT = 30;
export const COMMUNITY_SEARCH_LIMIT = 200;
export const COMMUNITY_POST_MAX = 2000;
export const COMMUNITY_COMMENT_MAX = 1000;
export const COMMUNITY_REPORT_MAX = 300;
export const COMMUNITY_TOPIC_MAX = 80;
export const COMMUNITY_PHOTO_MAX_SIZE = 5 * 1024 * 1024;
export const COMMUNITY_PHOTO_BUCKET = "community-post-photos";
export const COMMUNITY_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type CommunityAuthor = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type CommunityScanShare = {
  recordId: string;
  cropId: CropId;
  conditionCode: string;
  confidence: number;
  risk: RiskLevel;
  createdAt: string;
  record: StoredScanRecord;
};

export type CommunityPhoto = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  author: CommunityAuthor;
  body: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  reported: boolean;
};

export type CommunityPost = {
  id: string;
  authorId: string;
  author: CommunityAuthor;
  topic: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  photo: CommunityPhoto | null;
  scan: CommunityScanShare | null;
  comments: CommunityComment[];
  canEdit: boolean;
  reported: boolean;
};

export type CommunityFeedResponse = {
  viewerId: string;
  posts: CommunityPost[];
  scanOptions: CommunityScanShare[];
  query?: string | null;
};

export type CommunityTargetType = "post" | "comment";
export type CommunityProfileError = "database_not_configured" | "profile_required" | "service";

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type CommunityPostRow = {
  id: string;
  author_id: string;
  topic: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  photo_path: string | null;
  photo_width: number | null;
  photo_height: number | null;
  photo_alt: string | null;
  scan_record_id: string | null;
  scan_crop_id: string | null;
  scan_condition_code: string | null;
  scan_confidence: number | null;
  scan_risk: string | null;
  scan_created_at: string | null;
};

type CommunityCommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type CommunityReportRow = {
  target_type: CommunityTargetType;
  target_id: string;
};

const DATABASE_SETUP_ERROR_CODES = new Set(["PGRST202", "PGRST204", "PGRST205", "42P01", "42703", "42883"]);

export function isDatabaseSetupError(error: { code?: string; message?: string }) {
  if (error.code && DATABASE_SETUP_ERROR_CODES.has(error.code)) return true;
  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("row-level security")
    || message.includes("violates row-level security")
    || message.includes("permission denied")
    || message.includes("not authorized")
    || message.includes("unauthorized")) {
    return false;
  }
  const mentionsCommunitySchema = message.includes("community_posts")
    || message.includes("community_comments")
    || message.includes("community_reports")
    || message.includes("profiles")
    || message.includes("username")
    || message.includes("topic")
    || message.includes("photo_path")
    || message.includes("scan_record_id")
    || message.includes("hidden_at")
    || message.includes("delete_community_post")
    || message.includes("delete_community_comment");
  const looksLikeMissingSchema = message.includes("does not exist")
    || message.includes("could not find")
    || message.includes("schema cache")
    || message.includes("column")
    || message.includes("relation")
    || message.includes("function");
  return mentionsCommunitySchema && looksLikeMissingSchema;
}

export function isCommunityPermissionError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42501"
    || message.includes("row-level security")
    || message.includes("violates row-level security")
    || message.includes("permission denied")
    || message.includes("not authorized")
    || message.includes("unauthorized");
}

export function readJsonObject(payload: unknown) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : null;
}

export function cleanBody(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const body = value.trim();
  if (!body || body.length > maxLength) return null;
  return body;
}

export function cleanTopic(value: unknown) {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const topic = value.trim().replace(/\s+/g, " ");
  if (!topic) return null;
  if (topic.length < 2 || topic.length > COMMUNITY_TOPIC_MAX) return null;
  return topic;
}

export function cleanSearchQuery(value: unknown) {
  if (typeof value !== "string") return null;
  const query = value.trim().replace(/\s+/g, " ");
  if (!query) return null;
  return query.slice(0, 80);
}

export function cleanReportReason(value: unknown) {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const reason = value.trim();
  if (!reason) return null;
  return reason.length <= COMMUNITY_REPORT_MAX ? reason : null;
}

export function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function readPositiveInteger(value: unknown) {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return typeof parsed === "number" && Number.isInteger(parsed) && parsed > 0 && parsed <= 12000
    ? parsed
    : null;
}

export function photoExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return null;
}

export function scanShareFromRecord(record: StoredScanRecord): CommunityScanShare {
  return {
    recordId: record.id,
    cropId: record.cropId,
    conditionCode: record.conditionCode,
    confidence: record.confidence,
    risk: record.risk,
    createdAt: record.createdAt,
    record,
  };
}

export function scanInsertFields(scan: CommunityScanShare | null) {
  if (!scan) {
    return {
      scan_record_id: null,
      scan_crop_id: null,
      scan_condition_code: null,
      scan_confidence: null,
      scan_risk: null,
      scan_created_at: null,
    };
  }
  return {
    scan_record_id: scan.recordId,
    scan_crop_id: scan.cropId,
    scan_condition_code: scan.conditionCode,
    scan_confidence: scan.confidence,
    scan_risk: scan.risk,
    scan_created_at: scan.createdAt,
  };
}

export function scanShareFromPostRow(row: CommunityPostRow): CommunityScanShare | null {
  if (
    !row.scan_record_id
    || (row.scan_crop_id !== "rice" && row.scan_crop_id !== "cassava" && row.scan_crop_id !== "unknown")
    || !row.scan_condition_code
    || typeof row.scan_confidence !== "number"
    || row.scan_confidence < 0
    || row.scan_confidence > 1
    || (row.scan_risk !== "high" && row.scan_risk !== "medium" && row.scan_risk !== "low")
    || !row.scan_created_at
  ) {
    return null;
  }
  const record = createStoredScanRecord({
    cropId: row.scan_crop_id,
    conditionCode: row.scan_condition_code,
    confidence: row.scan_confidence,
    risk: row.scan_risk,
  }, {
    id: row.scan_record_id,
    createdAt: row.scan_created_at,
  });
  return scanShareFromRecord(record);
}

export function scanOptionsForUser(user: User) {
  return registeredScanState(user).records.slice(0, 10).map(scanShareFromRecord);
}

export function pickUserScanShare(user: User, scanRecordId: string | null) {
  if (!scanRecordId) return { scan: null, error: null };
  const scan = scanOptionsForUser(user).find((option) => option.recordId === scanRecordId) ?? null;
  return scan ? { scan, error: null } : { scan: null, error: "invalid_scan" as const };
}

export function hasValidCommunityUsername(profile?: ProfileRow) {
  return Boolean(profile?.username && isValidUsername(normalizeUsername(profile.username)));
}

export async function ensureCommunityProfile(supabase: SupabaseClient, user: User): Promise<{
  profile: CommunityAuthor | null;
  error: CommunityProfileError | null;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { profile: null, error: isDatabaseSetupError(error) ? "database_not_configured" : "service" };
  }

  const databaseUsername = typeof data?.username === "string" ? normalizeUsername(data.username) : null;
  if (databaseUsername && isValidUsername(databaseUsername)) {
    return {
      profile: {
        id: user.id,
        username: databaseUsername,
        displayName: typeof data?.display_name === "string" ? data.display_name : null,
        avatarUrl: typeof data?.avatar_url === "string" ? data.avatar_url : readAccountProfile(user).avatarUrl,
      },
      error: null,
    };
  }

  const metadataProfile = readAccountProfile(user);
  if (!metadataProfile.username) {
    return { profile: null, error: "profile_required" };
  }

  const { error: claimError } = await supabase.rpc("claim_harvestly_username", {
    p_username: metadataProfile.username,
  });

  if (claimError) {
    if (claimError.code === "23505") return { profile: null, error: "profile_required" };
    return { profile: null, error: isDatabaseSetupError(claimError) ? "database_not_configured" : "service" };
  }

  return {
    profile: {
      id: user.id,
      username: metadataProfile.username,
      displayName: null,
      avatarUrl: metadataProfile.avatarUrl,
    },
    error: null,
  };
}

export function buildCommunityFeed(
  viewerId: string,
  postRows: CommunityPostRow[],
  commentRows: CommunityCommentRow[],
  profileRows: ProfileRow[],
  reportRows: CommunityReportRow[],
  photoUrls: Map<string, string> = new Map(),
): CommunityPost[] {
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));
  const reportedPosts = new Set(reportRows.filter((report) => report.target_type === "post").map((report) => report.target_id));
  const reportedComments = new Set(reportRows.filter((report) => report.target_type === "comment").map((report) => report.target_id));
  const commentsByPost = new Map<string, CommunityComment[]>();

  for (const row of commentRows) {
    const comments = commentsByPost.get(row.post_id) ?? [];
    comments.push({
      id: row.id,
      postId: row.post_id,
      authorId: row.author_id,
      author: authorFromProfile(row.author_id, profileMap.get(row.author_id)),
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      canEdit: row.author_id === viewerId,
      reported: reportedComments.has(row.id),
    });
    commentsByPost.set(row.post_id, comments);
  }

  return postRows.map((row) => ({
    id: row.id,
    authorId: row.author_id,
    author: authorFromProfile(row.author_id, profileMap.get(row.author_id)),
    topic: row.topic,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photo: row.photo_path && photoUrls.has(row.photo_path)
      ? {
        url: photoUrls.get(row.photo_path) ?? "",
        width: row.photo_width,
        height: row.photo_height,
        alt: row.photo_alt,
      }
      : null,
    scan: scanShareFromPostRow(row),
    comments: commentsByPost.get(row.id) ?? [],
    canEdit: row.author_id === viewerId,
    reported: reportedPosts.has(row.id),
  }));
}

function authorFromProfile(id: string, profile?: ProfileRow): CommunityAuthor {
  return {
    id,
    username: profile?.username ?? null,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}
