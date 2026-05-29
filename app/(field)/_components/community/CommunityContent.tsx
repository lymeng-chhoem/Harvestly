"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CommunityComment, CommunityFeedResponse, CommunityPhoto, CommunityPost, CommunityScanShare, CommunityTargetType } from "@/lib/community";
import { confidenceText, localize, riskText, scanDateText } from "@/lib/harvestly-content";
import { profileSetupPath } from "@/lib/profile";
import { useProduct } from "../state/ProductProvider";

type CommunityError =
  | "database_not_configured"
  | "invalid_body"
  | "invalid_photo_size"
  | "invalid_photo_type"
  | "invalid_scan"
  | "invalid_topic"
  | "network"
  | "permission_denied"
  | "photo_storage_not_configured"
  | "photo_upload_failed"
  | "profile_required"
  | "service"
  | "unauthorized"
  | null;

type PhotoPreview = {
  file: File;
  url: string;
  width: number | null;
  height: number | null;
};

type CommunityText = {
  memberFallback: string;
  loadError: string;
  dbError: string;
  invalidBody: string;
  invalidPhoto: string;
  photoStorageNotConfigured: string;
  permissionDenied: string;
  invalidScan: string;
  invalidTopic: string;
  profileRequired: string;
  saved: string;
  reported: string;
};

function readCommunityError(payload: unknown): Exclude<CommunityError, null> {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return "service";
  const error = (payload as { error?: unknown }).error;
  return error === "database_not_configured"
    || error === "invalid_body"
    || error === "invalid_photo_size"
    || error === "invalid_photo_type"
    || error === "invalid_scan"
    || error === "invalid_topic"
    || error === "permission_denied"
    || error === "photo_storage_not_configured"
    || error === "photo_upload_failed"
    || error === "profile_required"
    || error === "unauthorized"
    ? error
    : "service";
}

function readCommunityDetail(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) return null;
  const detail = (payload as { detail?: unknown }).detail;
  return typeof detail === "string" && detail.trim() ? detail.trim() : null;
}

function authorName(post: Pick<CommunityPost | CommunityComment, "author">, fallback: string) {
  return post.author.username ? `@${post.author.username}` : fallback;
}

function authorInitial(post: Pick<CommunityPost | CommunityComment, "author">) {
  const label = post.author.username ?? "H";
  return label.slice(0, 1).toUpperCase();
}

function isSupportedPhoto(file: File) {
  return file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
}

function measurePhoto(file: File) {
  return new Promise<PhotoPreview>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ file, url, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ file, url, width: null, height: null });
    image.src = url;
  });
}

export function CommunityContent({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const { language, profileStatus } = useProduct();
  const [feed, setFeed] = useState<CommunityFeedResponse | null>(null);
  const [loading, setLoading] = useState(authenticated);
  const [error, setError] = useState<CommunityError>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [postTopic, setPostTopic] = useState("");
  const [postBody, setPostBody] = useState("");
  const [selectedScanId, setSelectedScanId] = useState("");
  const [photoPreview, setPhotoPreview] = useState<PhotoPreview | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [editingPost, setEditingPost] = useState<{ id: string; topic: string; body: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; body: string } | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const text = useMemo(() => ({
    memberFallback: language === "km" ? "គណនីមិនទាន់មានឈ្មោះ" : "Profile missing",
    loadError: language === "km" ? "មិនអាចបើកសហគមន៍បានទេ។ សូមព្យាយាមម្តងទៀត។" : "Unable to load the community. Please try again.",
    dbError: language === "km" ? "មូលដ្ឋានទិន្នន័យសហគមន៍មិនទាន់បានរៀបចំ។ សូមដំណើរការ Supabase migration ថ្មី។" : "The community database is not set up yet. Apply the new Supabase migration.",
    invalidBody: language === "km" ? "សូមសរសេរអត្ថបទខ្លីមួយ មុនពេលផ្ញើ។" : "Write a short message before posting.",
    invalidPhoto: language === "km" ? "រូបភាពត្រូវតែជា JPG, PNG ឬ WebP និងមិនលើស 5MB។" : "Use a JPG, PNG, or WebP photo up to 5MB.",
    photoStorageNotConfigured: language === "km" ? "កន្លែងរក្សារូបភាពសហគមន៍មិនទាន់បានរៀបចំទេ។ សូមដំណើរការ migration សម្រាប់ photo bucket។" : "Community photo storage is not set up yet. Run the photo bucket migration.",
    permissionDenied: language === "km" ? "Supabase បានរារាំងសកម្មភាពនេះ។ សូមដំណើរការ SQL repair សម្រាប់សហគមន៍។" : "Supabase blocked this action. Run the community repair SQL.",
    invalidScan: language === "km" ? "លទ្ធផលពិនិត្យនេះមិនមានក្នុងប្រវត្តិរបស់អ្នកទេ។" : "That scan is not available in your history.",
    invalidTopic: language === "km" ? "ប្រធានបទត្រូវមាន 2-80 តួអក្សរ។" : "Topic must be 2-80 characters.",
    profileRequired: language === "km" ? "សូមជ្រើសឈ្មោះអ្នកប្រើ មុនពេលចូលរួមសហគមន៍។" : "Choose a username before joining the community.",
    saved: language === "km" ? "បានរក្សាទុក" : "Saved",
    reported: language === "km" ? "បានរាយការណ៍" : "Reported",
  }), [language]);

  const loadFeed = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const response = await fetch(`/api/community/posts${params.size ? `?${params.toString()}` : ""}`, { cache: "no-store" });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const nextError = readCommunityError(payload);
        setError(nextError);
        setErrorDetail(readCommunityDetail(payload));
        setFeed(null);
        if (nextError === "profile_required") router.replace(profileSetupPath("/community"));
        return;
      }
      setFeed(payload as CommunityFeedResponse);
    } catch {
      setError("network");
      setErrorDetail(null);
      setFeed(null);
    } finally {
      setLoading(false);
    }
  }, [authenticated, router, searchQuery]);

  useEffect(() => {
    if (profileStatus === "incomplete") router.replace(profileSetupPath("/community"));
  }, [profileStatus, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFeed(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFeed]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview.url);
  }, [photoPreview]);

  useEffect(() => {
    if (!confirmDeleteKey) return;
    const timer = window.setTimeout(() => setConfirmDeleteKey(null), 4500);
    return () => window.clearTimeout(timer);
  }, [confirmDeleteKey]);

  async function mutate(url: string, options: RequestInit, successNotice?: string) {
    setBusyKey(url);
    setNotice(null);
    setError(null);
    setErrorDetail(null);
    try {
      const isFormData = options.body instanceof FormData;
      const response = await fetch(url, {
        ...options,
        headers: isFormData
          ? options.headers
          : {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
          },
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const nextError = readCommunityError(payload);
        setError(nextError);
        setErrorDetail(readCommunityDetail(payload));
        if (nextError === "profile_required") router.replace(profileSetupPath("/community"));
        return false;
      }
      if (successNotice) setNotice(successNotice);
      await loadFeed();
      return true;
    } catch {
      setError("network");
      setErrorDetail(null);
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!isSupportedPhoto(file) || file.size > 5 * 1024 * 1024) {
      setError(file.size > 5 * 1024 * 1024 ? "invalid_photo_size" : "invalid_photo_type");
      event.target.value = "";
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview.url);
    setPhotoPreview(await measurePhoto(file));
    setError(null);
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview.url);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData();
    data.set("topic", postTopic);
    data.set("body", postBody);
    data.set("scanRecordId", selectedScanId);
    if (photoPreview) {
      data.set("photo", photoPreview.file, photoPreview.file.name);
      if (photoPreview.width) data.set("photoWidth", String(photoPreview.width));
      if (photoPreview.height) data.set("photoHeight", String(photoPreview.height));
      data.set("photoAlt", postTopic || postBody.slice(0, 80));
    }
    const ok = await mutate("/api/community/posts", { method: "POST", body: data }, text.saved);
    if (ok) {
      setPostTopic("");
      setPostBody("");
      setSelectedScanId("");
      clearPhoto();
    }
  }

  async function updatePost(id: string) {
    if (!editingPost) return;
    const ok = await mutate(`/api/community/posts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ topic: editingPost.topic, body: editingPost.body }),
    }, text.saved);
    if (ok) setEditingPost(null);
  }

  async function deletePost(id: string) {
    const key = `post:${id}`;
    if (confirmDeleteKey !== key) {
      setConfirmDeleteKey(key);
      return;
    }
    await mutate(`/api/community/posts/${encodeURIComponent(id)}`, { method: "DELETE" }, text.saved);
    setConfirmDeleteKey(null);
  }

  async function createComment(postId: string) {
    const body = commentDrafts[postId] ?? "";
    const ok = await mutate(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }, text.saved);
    if (ok) setCommentDrafts((drafts) => ({ ...drafts, [postId]: "" }));
  }

  async function updateComment(id: string) {
    if (!editingComment) return;
    const ok = await mutate(`/api/community/comments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ body: editingComment.body }),
    }, text.saved);
    if (ok) setEditingComment(null);
  }

  async function deleteComment(id: string) {
    const key = `comment:${id}`;
    if (confirmDeleteKey !== key) {
      setConfirmDeleteKey(key);
      return;
    }
    await mutate(`/api/community/comments/${encodeURIComponent(id)}`, { method: "DELETE" }, text.saved);
    setConfirmDeleteKey(null);
  }

  async function report(targetType: CommunityTargetType, targetId: string) {
    await mutate("/api/community/reports", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId }),
    }, text.reported);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchInput("");
    setSearchQuery("");
  }

  if (!authenticated) {
    return (
      <div className="route-page centered-page">
        <section className="community-card parchment-panel">
          <CommunityMark />
          <p className="eyebrow">{language === "km" ? "សហគមន៍" : "Community"}</p>
          <h1>{language === "km" ? "បង្កើតគណនីដើម្បីចូលសហគមន៍" : "Sign up to access community support"}</h1>
          <p>{language === "km" ? "សមាជិកអាចសួរ ចែករំលែកបទពិសោធន៍ និងពិភាក្សាពីលទ្ធផលពិនិត្យដំណាំ។" : "Members can ask questions, share field experience, and discuss crop scan results."}</p>
          <div className="access-links">
            <Link className="rust-button" href="/signup?next=/community">{language === "km" ? "បង្កើតគណនី" : "Sign up"}</Link>
            <Link className="paper-button" href="/login?next=/community">{language === "km" ? "ចូលគណនី" : "Login"}</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="route-page community-page">
      <header className="route-header compact community-header">
        <div>
          <p className="eyebrow">{language === "km" ? "សហគមន៍" : "Community"}</p>
          <h1>{language === "km" ? "ពិភាក្សាជាមួយកសិករផ្សេងៗ" : "Share field experience"}</h1>
          <p>{language === "km" ? "ស្វែងរកប្រធានបទ សួរ ឆ្លើយ និងចែករំលែករូបភាពពីវាលស្រែ។" : "Search topics, ask questions, and share field photos with your username."}</p>
        </div>
        <div className="community-header-actions">
          <button className="paper-button community-refresh" disabled={loading} type="button" onClick={() => void loadFeed()}>
            {loading ? (language === "km" ? "កំពុងបើក..." : "Loading...") : (language === "km" ? "ផ្ទុកឡើងវិញ" : "Refresh")}
          </button>
          <button
            aria-expanded={searchOpen}
            aria-label={searchOpen ? (language === "km" ? "បិទការស្វែងរក" : "Close search") : (language === "km" ? "បើកការស្វែងរក" : "Open search")}
            className={`community-icon-button ${searchOpen || searchQuery ? "is-active" : ""}`}
            type="button"
            onClick={() => {
              if (searchOpen) {
                closeSearch();
                return;
              }
              setSearchOpen(true);
            }}
          >
            <SearchIcon />
          </button>
        </div>
      </header>

      {searchOpen && (
        <form className="community-search parchment-panel" onSubmit={(event) => {
          event.preventDefault();
          setSearchQuery(searchInput.trim());
        }}>
          <div className="community-search-field">
            <SearchIcon />
            <input
              aria-label={language === "km" ? "ស្វែងរកប្រធានបទ ឬ @username" : "Search topic, text, or @username"}
              autoFocus
              maxLength={80}
              placeholder={language === "km" ? "ឧ. rice_blast ឬ @farmer_sokha" : "e.g. rice blast or @farmer_sokha"}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button className="rust-button community-search-submit" type="submit" aria-label={language === "km" ? "ស្វែងរក" : "Search"}>
            <SearchIcon />
          </button>
          <button className="paper-button community-search-clear" type="button" aria-label={language === "km" ? "លុបការស្វែងរក" : "Clear search"} onClick={closeSearch}>
            <CloseIcon />
          </button>
        </form>
      )}

      <section className="community-composer parchment-panel">
        <form onSubmit={(event) => void createPost(event)}>
          <label>
            <span>{language === "km" ? "ប្រធានបទ" : "Topic"}</span>
            <input
              className="community-topic-input"
              maxLength={80}
              placeholder={language === "km" ? "ឧ. ស្លឹកស្រូវមានចំណុច" : "e.g. Rice leaf spots"}
              value={postTopic}
              onChange={(event) => setPostTopic(event.target.value)}
            />
          </label>
          <label>
            <span>{language === "km" ? "ចែករំលែកអ្វីដែលអ្នកបានឃើញ" : "Share what you are seeing"}</span>
            <textarea
              maxLength={2000}
              placeholder={language === "km" ? "សរសេរសំណួរ ឬបទពិសោធន៍ពីការប្រើ Harvestly..." : "Write a question or experience from using Harvestly..."}
              value={postBody}
              onChange={(event) => setPostBody(event.target.value)}
            />
          </label>
          <div className="photo-picker">
            <label className="paper-button">
              {language === "km" ? "ភ្ជាប់រូប" : "Attach photo"}
              <input ref={photoInputRef} accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => void selectPhoto(event)} />
            </label>
            {photoPreview && (
              <div className="photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={photoPreview.url} />
                <button className="text-button danger-action" type="button" onClick={clearPhoto}>{language === "km" ? "ដករូប" : "Remove"}</button>
              </div>
            )}
          </div>
          <div className="community-composer-tools">
            <label className="scan-picker">
              <span>{language === "km" ? "ភ្ជាប់លទ្ធផលពិនិត្យ" : "Attach scan"}</span>
              <select value={selectedScanId} onChange={(event) => setSelectedScanId(event.target.value)}>
                <option value="">{language === "km" ? "មិនភ្ជាប់" : "No scan"}</option>
                {(feed?.scanOptions ?? []).map((scan) => (
                  <option key={scan.recordId} value={scan.recordId}>{localize(scan.record.finding, language)}</option>
                ))}
              </select>
            </label>
            <span className="composer-count">{postBody.trim().length}/2000</span>
            <button className="rust-button" disabled={Boolean(busyKey) || !postBody.trim()} type="submit">
              {busyKey === "/api/community/posts" ? (language === "km" ? "កំពុងផ្ញើ..." : "Posting...") : (language === "km" ? "បង្ហោះ" : "Post")}
            </button>
          </div>
        </form>
      </section>

      {notice && <p className="community-notice" role="status">{notice}</p>}
      {error && (
        <p className="form-error community-error" role="alert">
          {errorMessage(error, text)}
          {errorDetail && <span>{errorDetail}</span>}
        </p>
      )}

      {loading ? (
        <CommunitySkeleton />
      ) : feed && feed.posts.length > 0 ? (
        <section className="community-feed" aria-label={language === "km" ? "ការបង្ហោះសហគមន៍" : "Community posts"}>
          {feed.posts.map((post) => (
            <article className="community-post dark-panel" key={post.id}>
              <PostHeader post={post} fallback={text.memberFallback} language={language} />

              {editingPost?.id === post.id ? (
                <EditPostBox
                  topic={editingPost.topic}
                  body={editingPost.body}
                  onTopicChange={(topic) => setEditingPost({ ...editingPost, topic })}
                  onBodyChange={(body) => setEditingPost({ ...editingPost, body })}
                  onCancel={() => setEditingPost(null)}
                  onSave={() => void updatePost(post.id)}
                  saving={busyKey === `/api/community/posts/${post.id}`}
                  language={language}
                />
              ) : (
                <>
                  {post.topic && <h2 className="post-topic">{post.topic}</h2>}
                  <p className="community-body">{post.body}</p>
                </>
              )}

              {post.photo && <PostPhoto photo={post.photo} />}
              {post.scan && <ScanShare scan={post.scan} language={language} />}

              <div className="community-actions">
                {post.canEdit ? (
                  <>
                    <button className="text-button" disabled={Boolean(busyKey)} type="button" onClick={() => setEditingPost({ id: post.id, topic: post.topic ?? "", body: post.body })}>{language === "km" ? "កែ" : "Edit"}</button>
                    <button className="text-button danger-action" disabled={Boolean(busyKey)} type="button" onClick={() => void deletePost(post.id)}>
                      {busyKey === `/api/community/posts/${post.id}`
                        ? (language === "km" ? "កំពុងលុប..." : "Deleting...")
                        : confirmDeleteKey === `post:${post.id}`
                          ? (language === "km" ? "បញ្ជាក់លុប" : "Confirm")
                          : (language === "km" ? "លុប" : "Delete")}
                    </button>
                  </>
                ) : (
                  <button className="text-button" disabled={post.reported || Boolean(busyKey)} type="button" onClick={() => void report("post", post.id)}>
                    {busyKey === "/api/community/reports" ? (language === "km" ? "កំពុងរាយការណ៍..." : "Reporting...") : post.reported ? (language === "km" ? "បានរាយការណ៍" : "Reported") : (language === "km" ? "រាយការណ៍" : "Report")}
                  </button>
                )}
              </div>

              <div className="comment-thread">
                <h2>{language === "km" ? "ការឆ្លើយតប" : "Replies"}</h2>
                {post.comments.map((comment) => (
                  <div className="community-comment" key={comment.id}>
                    <PostHeader post={comment} fallback={text.memberFallback} language={language} small />
                    {editingComment?.id === comment.id ? (
                      <EditBox
                        label={language === "km" ? "កែសម្រួលការឆ្លើយតប" : "Edit reply"}
                        maxLength={1000}
                        value={editingComment.body}
                        onChange={(body) => setEditingComment({ id: comment.id, body })}
                        onCancel={() => setEditingComment(null)}
                        onSave={() => void updateComment(comment.id)}
                        saving={busyKey === `/api/community/comments/${comment.id}`}
                        language={language}
                      />
                    ) : (
                      <p className="community-body comment-body">{comment.body}</p>
                    )}
                    <div className="community-actions comment-actions">
                      {comment.canEdit ? (
                        <>
                          <button className="text-button" disabled={Boolean(busyKey)} type="button" onClick={() => setEditingComment({ id: comment.id, body: comment.body })}>{language === "km" ? "កែ" : "Edit"}</button>
                          <button className="text-button danger-action" disabled={Boolean(busyKey)} type="button" onClick={() => void deleteComment(comment.id)}>
                            {busyKey === `/api/community/comments/${comment.id}`
                              ? (language === "km" ? "កំពុងលុប..." : "Deleting...")
                              : confirmDeleteKey === `comment:${comment.id}`
                                ? (language === "km" ? "បញ្ជាក់លុប" : "Confirm")
                                : (language === "km" ? "លុប" : "Delete")}
                          </button>
                        </>
                      ) : (
                        <button className="text-button" disabled={comment.reported || Boolean(busyKey)} type="button" onClick={() => void report("comment", comment.id)}>
                          {busyKey === "/api/community/reports" ? (language === "km" ? "កំពុងរាយការណ៍..." : "Reporting...") : comment.reported ? (language === "km" ? "បានរាយការណ៍" : "Reported") : (language === "km" ? "រាយការណ៍" : "Report")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <form className="comment-form" onSubmit={(event) => {
                  event.preventDefault();
                  void createComment(post.id);
                }}>
                  <input
                    maxLength={1000}
                    placeholder={language === "km" ? "ឆ្លើយតប..." : "Reply..."}
                    value={commentDrafts[post.id] ?? ""}
                    onChange={(event) => setCommentDrafts((drafts) => ({ ...drafts, [post.id]: event.target.value }))}
                  />
                  <button className="paper-button" disabled={Boolean(busyKey) || !(commentDrafts[post.id] ?? "").trim()} type="submit">
                    {busyKey === `/api/community/posts/${post.id}/comments` ? (language === "km" ? "កំពុងផ្ញើ..." : "Sending...") : (language === "km" ? "ផ្ញើ" : "Send")}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="history-empty compact-empty dark-panel community-empty">
          <h2>{searchQuery ? (language === "km" ? "រកមិនឃើញប្រធានបទនេះទេ" : "No matching posts") : (language === "km" ? "មិនទាន់មានការបង្ហោះទេ" : "No posts yet")}</h2>
          <p>{searchQuery ? (language === "km" ? "សាកល្បងស្វែងរកពាក្យផ្សេង ឬ @username ផ្សេង។" : "Try another keyword, topic, or @username.") : (language === "km" ? "ចាប់ផ្តើមដោយសួរសំណួរ ឬចែករំលែកអ្វីដែលអ្នកបានរៀនពីការពិនិត្យដំណាំ។" : "Start by asking a question or sharing what you learned from a crop check.")}</p>
        </section>
      )}
    </div>
  );
}

function errorMessage(error: CommunityError, text: CommunityText) {
  if (error === "database_not_configured") return text.dbError;
  if (error === "invalid_body") return text.invalidBody;
  if (error === "invalid_scan") return text.invalidScan;
  if (error === "invalid_topic") return text.invalidTopic;
  if (error === "permission_denied") return text.permissionDenied;
  if (error === "photo_storage_not_configured") return text.photoStorageNotConfigured;
  if (error === "invalid_photo_size" || error === "invalid_photo_type" || error === "photo_upload_failed") return text.invalidPhoto;
  if (error === "profile_required") return text.profileRequired;
  return text.loadError;
}

function CommunityMark() {
  return (
    <div className="community-mark" aria-hidden="true">
      <svg viewBox="0 0 72 72"><path d="M23 35a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm26 0a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM7 58c1-12 10-18 20-18 5 0 9 2 12 5m-2 13c1-12 10-18 20-18 5 0 9 2 12 5" /></svg>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function PostHeader({ post, fallback, language, small = false }: { post: Pick<CommunityPost | CommunityComment, "author" | "createdAt">; fallback: string; language: "km" | "en"; small?: boolean }) {
  return (
    <header className={`post-author ${small ? "small" : ""}`}>
      {post.author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={post.author.avatarUrl} />
      ) : (
        <span aria-hidden="true">{authorInitial(post)}</span>
      )}
      <div>
        <strong>{authorName(post, fallback)}</strong>
        <time dateTime={post.createdAt}>{scanDateText(post.createdAt, language)}</time>
      </div>
    </header>
  );
}

function PostPhoto({ photo }: { photo: CommunityPhoto }) {
  return (
    <figure className="post-photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={photo.alt ?? ""} src={photo.url} width={photo.width ?? undefined} height={photo.height ?? undefined} />
    </figure>
  );
}

function ScanShare({ scan, language }: { scan: CommunityScanShare; language: "km" | "en" }) {
  return (
    <div className="shared-scan">
      <div>
        <span>{language === "km" ? "លទ្ធផលពិនិត្យដំណាំ" : "Shared scan"}</span>
        <strong>{localize(scan.record.finding, language)}</strong>
      </div>
      <dl>
        <div>
          <dt>{language === "km" ? "ដំណាំ" : "Crop"}</dt>
          <dd>{localize(scan.record.crop, language)}</dd>
        </div>
        <div>
          <dt>{language === "km" ? "ហានិភ័យ" : "Risk"}</dt>
          <dd>{riskText(scan.risk, language)}</dd>
        </div>
        <div>
          <dt>{language === "km" ? "ភាពជឿជាក់" : "Confidence"}</dt>
          <dd>{confidenceText(scan.confidence, language)}</dd>
        </div>
      </dl>
      <p>{localize(scan.record.summary, language)}</p>
    </div>
  );
}

function EditPostBox({
  topic,
  body,
  onTopicChange,
  onBodyChange,
  onCancel,
  onSave,
  saving,
  language,
}: {
  topic: string;
  body: string;
  onTopicChange: (topic: string) => void;
  onBodyChange: (body: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  language: "km" | "en";
}) {
  return (
    <div className="community-edit">
      <label>
        <span>{language === "km" ? "ប្រធានបទ" : "Topic"}</span>
        <input maxLength={80} value={topic} onChange={(event) => onTopicChange(event.target.value)} />
      </label>
      <label>
        <span>{language === "km" ? "កែសម្រួលការបង្ហោះ" : "Edit post"}</span>
        <textarea maxLength={2000} value={body} onChange={(event) => onBodyChange(event.target.value)} />
      </label>
      <div>
        <span>{body.trim().length}/2000</span>
        <button className="paper-button" type="button" onClick={onCancel}>{language === "km" ? "បោះបង់" : "Cancel"}</button>
        <button className="rust-button" disabled={saving || !body.trim()} type="button" onClick={onSave}>{saving ? (language === "km" ? "កំពុងរក្សា..." : "Saving...") : (language === "km" ? "រក្សាទុក" : "Save")}</button>
      </div>
    </div>
  );
}

function EditBox({
  label,
  maxLength,
  value,
  onChange,
  onCancel,
  onSave,
  saving,
  language,
}: {
  label: string;
  maxLength: number;
  value: string;
  onChange: (body: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  language: "km" | "en";
}) {
  return (
    <div className="community-edit">
      <label>
        <span>{label}</span>
        <textarea maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
      <div>
        <span>{value.trim().length}/{maxLength}</span>
        <button className="paper-button" type="button" onClick={onCancel}>{language === "km" ? "បោះបង់" : "Cancel"}</button>
        <button className="rust-button" disabled={saving || !value.trim()} type="button" onClick={onSave}>{saving ? (language === "km" ? "កំពុងរក្សា..." : "Saving...") : (language === "km" ? "រក្សាទុក" : "Save")}</button>
      </div>
    </div>
  );
}

function CommunitySkeleton() {
  return (
    <section className="community-feed" aria-hidden="true">
      {[0, 1].map((item) => (
        <div className="community-post dark-panel community-loading" key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </section>
  );
}
