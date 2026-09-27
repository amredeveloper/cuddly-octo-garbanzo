import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import {
  CONFIG_STORAGE_KEY,
  resolveSupabaseConfig,
  saveSupabaseConfig as persistConfig,
} from "./config.js";

const SETTINGS_KEY = "cove.settings";
const PRESENCE_WINDOW_MS = 35_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,23}$/;
const MESSAGE_PAGE = 80;

function now() {
  return Date.now();
}

function ts(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const n = Date.parse(value);
  return Number.isFinite(n) ? n : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapSbError(error, fallback = "ERROR") {
  if (!error) throw new Error(fallback);
  const msg = String(error.message || error.error_description || "");
  const lower = msg.toLowerCase();
  const code = String(error.code || error.status || "");
  console.error("Supabase error:", error);
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("fetch") ||
    error.name === "AuthRetryableFetchError" ||
    error.name === "TypeError"
  ) {
    throw new Error("NETWORK_ERROR");
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    throw new Error("WRONG_CREDENTIALS");
  }
  if (lower.includes("already registered") || lower.includes("user already")) {
    throw new Error("EMAIL_TAKEN");
  }
  if (lower.includes("password") && (lower.includes("least") || lower.includes("weak") || lower.includes("short"))) {
    throw new Error("PASSWORD_SHORT");
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    throw new Error("INVALID_EMAIL");
  }
  if (code === "23505" || lower.includes("duplicate")) {
    if (lower.includes("username")) throw new Error("USERNAME_TAKEN");
    throw new Error("EMAIL_TAKEN");
  }
  if (lower.includes("username") && (lower.includes("unique") || lower.includes("already"))) {
    throw new Error("USERNAME_TAKEN");
  }
  if (
    lower.includes("jwt") ||
    lower.includes("expired") ||
    lower.includes("not authenticated") ||
    code === "PGRST301" ||
    code === "401"
  ) {
    throw new Error("UNAUTHENTICATED");
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("forbidden") ||
    code === "42501" ||
    code === "403"
  ) {
    throw new Error("FORBIDDEN");
  }
  if (lower.includes("user not found") || code === "P0002") {
    throw new Error("NOT_FOUND");
  }
  if (lower.includes("confirm") && lower.includes("email")) {
    throw new Error("EMAIL_CONFIRM");
  }
  throw new Error(fallback);
}

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name ?? row.displayName,
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? "",
    bio: row.bio || "",
    lastSeen: ts(row.last_seen ?? row.lastSeen) || 0,
    showOnline: row.show_online ?? row.showOnline !== false,
    showLastSeen: row.show_last_seen ?? row.showLastSeen !== false,
    onlineStatus: !!(row.online_status ?? row.onlineStatus),
    createdAt: ts(row.created_at ?? row.createdAt) || 0,
  };
}

function mapMessage(row, myId) {
  if (!row) return null;
  const createdAt = ts(row.created_at ?? row.createdAt);
  const deliveredAt = ts(row.delivered_at ?? row.deliveredAt);
  const readAt = ts(row.read_at ?? row.readAt);
  const senderId = row.sender_id ?? row.senderId;
  const mine = senderId === myId;
  let status = "sent";
  if (row.failed) status = "failed";
  else if (row.sending) status = "sending";
  else if (readAt) status = "read";
  else if (deliveredAt) status = "delivered";
  return {
    id: row.id,
    conversationId: row.conversation_id ?? row.conversationId,
    senderId,
    content: row.content || "",
    attachmentUrl: (row.attachment_url ?? row.attachmentUrl) || "",
    attachmentName: (row.attachment_name ?? row.attachmentName) || "",
    attachmentType: (row.attachment_type ?? row.attachmentType) || "",
    createdAt,
    deliveredAt,
    readAt,
    status,
    mine,
  };
}

export class SupabaseBackend {
  constructor() {
    this.listeners = new Set();
    this.sb = null;
    this.session = null;
    this.channel = null;
    this.heartbeat = null;
    this.authSub = null;
    this.config = resolveSupabaseConfig();
    this._initClient();
  }

  isConfigured() {
    return !!(this.config?.url && this.config?.anonKey && this.sb);
  }

  saveConnection({ url, anonKey }) {
    const next = persistConfig({ url, anonKey });
    this.config = { ...next, source: "local" };
    this.unsubscribeRealtime();
    this.stopPresence();
    if (this.authSub) {
      this.authSub.subscription?.unsubscribe?.();
      this.authSub = null;
    }
    this._initClient();
    return next;
  }

  clearConnection() {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    this.config = resolveSupabaseConfig();
    this.unsubscribeRealtime();
    this.stopPresence();
    this.sb = null;
    this._initClient();
  }

  _initClient() {
    this.config = this.config || resolveSupabaseConfig();
    if (!this.config) {
      this.sb = null;
      return;
    }
    try {
      this.sb = createClient(this.config.url, this.config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
        },
        realtime: {
          params: { eventsPerSecond: 8 },
        },
      });
      const { data } = this.sb.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          this.session = null;
          this.stopPresence();
          this.unsubscribeRealtime();
          this.emit("session", null);
        }
        if (event === "TOKEN_REFRESHED") {
          /* session kept by the client */
        }
      });
      this.authSub = data;
    } catch (err) {
      console.error("Failed to create Supabase client", err);
      this.sb = null;
    }
  }

  requireClient() {
    if (!this.sb) {
      throw new Error("CONFIG_MISSING");
    }
    return this.sb;
  }

  emit(type, payload) {
    for (const fn of this.listeners) {
      try {
        fn(type, payload);
      } catch (err) {
        console.error("listener error", err);
      }
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getSettings() {
    const defaults = {
      theme: "system",
      language: "en",
      notifications: true,
      sound: true,
    };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  saveSettings(patch) {
    const next = { ...this.getSettings(), ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    return next;
  }

  async requireUser() {
    const sb = this.requireClient();
    const { data, error } = await sb.auth.getSession();
    if (error) mapSbError(error, "UNAUTHENTICATED");
    const session = data?.session;
    if (!session?.user) {
      this.session = null;
      throw new Error("UNAUTHENTICATED");
    }
    this.session = session;
    return { sb, session, userId: session.user.id };
  }

  async loadProfile(userId, { upsert = false, meta } = {}) {
    const sb = this.requireClient();
    for (let i = 0; i < 10; i++) {
      const { data, error } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) mapSbError(error, "ERROR");
      if (data) return mapProfile(data);
      await sleep(150 + i * 80);
    }
    if (!upsert) return null;
    const username =
      meta?.username && USERNAME_RE.test(meta.username)
        ? meta.username
        : `user_${String(userId).replace(/-/g, "").slice(0, 8)}`;
    const displayName =
      (meta?.displayName && String(meta.displayName).trim().length >= 2
        ? String(meta.displayName).trim()
        : username);
    const { data, error } = await sb
      .from("profiles")
      .upsert(
        {
          id: userId,
          username,
          display_name: displayName,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();
    if (error) mapSbError(error, "ERROR");
    return mapProfile(data);
  }

  async getSession() {
    try {
      const { userId, session } = await this.requireUser();
      const profile = await this.loadProfile(userId, {
        upsert: true,
        meta: {
          username: session.user.user_metadata?.username,
          displayName: session.user.user_metadata?.display_name,
        },
      });
      return profile;
    } catch (err) {
      if (err.message === "CONFIG_MISSING") return null;
      if (err.message === "UNAUTHENTICATED") return null;
      if (err.message === "NETWORK_ERROR") throw err;
      console.error(err);
      return null;
    }
  }

  async signUp({ name, username, email, password }) {
    const sb = this.requireClient();
    const displayName = String(name || "").trim();
    const uname = String(username || "").trim();
    const mail = String(email || "").trim().toLowerCase();
    if (displayName.length < 2) throw new Error("NAME_SHORT");
    if (!USERNAME_RE.test(uname)) throw new Error("USERNAME_INVALID");
    if (!EMAIL_RE.test(mail)) throw new Error("INVALID_EMAIL");
    if (!password || password.length < 8) throw new Error("PASSWORD_SHORT");

    const { data, error } = await sb.auth.signUp({
      email: mail,
      password,
      options: {
        data: {
          username: uname,
          display_name: displayName,
        },
      },
    });
    if (error) mapSbError(error, "ERROR");
    if (!data.session) {
      throw new Error("EMAIL_CONFIRM");
    }
    this.session = data.session;
    const profile = await this.loadProfile(data.user.id, {
      upsert: true,
      meta: { username: uname, displayName },
    });
    // Prefer the username they asked for if the trigger had to suffix it.
    if (profile && profile.username.toLowerCase() !== uname.toLowerCase()) {
      try {
        return await this.updateProfile({ username: uname, displayName });
      } catch (err) {
        if (err.message === "USERNAME_TAKEN") return profile;
        throw err;
      }
    }
    this.subscribeRealtime();
    this.startPresence();
    return profile;
  }

  async login({ email, password }) {
    const sb = this.requireClient();
    const mail = String(email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) throw new Error("INVALID_EMAIL");
    if (!password) throw new Error("WRONG_CREDENTIALS");
    const { data, error } = await sb.auth.signInWithPassword({
      email: mail,
      password,
    });
    if (error) mapSbError(error, "WRONG_CREDENTIALS");
    this.session = data.session;
    const profile = await this.loadProfile(data.user.id, { upsert: true });
    this.subscribeRealtime();
    this.startPresence();
    return profile;
  }

  async logout() {
    this.setPresence(false);
    this.stopPresence();
    this.unsubscribeRealtime();
    if (this.sb) {
      const { error } = await this.sb.auth.signOut();
      if (error) console.error("signOut", error);
    }
    this.session = null;
    this.emit("session", null);
  }

  async switchAccount() {
    await this.logout();
  }

  startPresence() {
    this.stopPresence();
    this.setPresence(true);
    this.subscribeRealtime();
    this.heartbeat = setInterval(() => this.setPresence(true), 20_000);
    this._onVis = () => {
      this.setPresence(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", this._onVis);
    window.addEventListener("beforeunload", this._onUnload);
  }

  _onUnload = () => {
    this.setPresence(false);
  };

  stopPresence() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    if (this._onVis) {
      document.removeEventListener("visibilitychange", this._onVis);
      this._onVis = null;
    }
    window.removeEventListener("beforeunload", this._onUnload);
  }

  async setPresence(online) {
    if (!this.sb) return;
    try {
      const { error } = await this.sb.rpc("touch_presence", { is_online: !!online });
      if (error) console.error("presence", error);
    } catch (err) {
      console.error("presence", err);
    }
  }

  isOnline(profile) {
    if (!profile) return false;
    if (profile.showOnline === false) return false;
    const me = this.session?.user?.id;
    if (profile.id === me) return true;
    if (!profile.lastSeen) return false;
    return now() - profile.lastSeen < PRESENCE_WINDOW_MS;
  }

  unsubscribeRealtime() {
    if (this.channel && this.sb) {
      try {
        this.sb.removeChannel(this.channel);
      } catch (err) {
        console.error("removeChannel", err);
      }
    }
    this.channel = null;
  }

  subscribeRealtime() {
    if (!this.sb) return;
    this.unsubscribeRealtime();
    const channel = this.sb
      .channel("cove-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const myId = this.session?.user?.id;
          const message = mapMessage(payload.new, myId);
          this.emit("message", { conversationId: message.conversationId, message });
          this.emit("change", { reason: "message" });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          this.emit("change", { reason: "message-update" });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          this.emit("change", { reason: "conversation" });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_members" },
        () => {
          this.emit("change", { reason: "membership" });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          this.emit("presence");
          this.emit("change", { reason: "profile" });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime connection error:", status);
          this.emit("realtime-error", { status });
        }
      });
    this.channel = channel;
  }

  async updateProfile(patch) {
    const { sb, userId } = await this.requireUser();
    const next = {};
    if (patch.displayName != null) {
      const n = String(patch.displayName).trim();
      if (n.length < 2) throw new Error("NAME_SHORT");
      next.display_name = n;
    }
    if (patch.username != null) {
      const uname = String(patch.username).trim();
      if (!USERNAME_RE.test(uname)) throw new Error("USERNAME_INVALID");
      next.username = uname;
    }
    if (patch.bio != null) next.bio = String(patch.bio).slice(0, 140);
    if (patch.showOnline != null) next.show_online = !!patch.showOnline;
    if (patch.showLastSeen != null) next.show_last_seen = !!patch.showLastSeen;
    if (patch.avatarUrl != null) {
      next.avatar_url = await this._storeAvatar(userId, patch.avatarUrl, patch.avatarBlob);
    }
    const { data, error } = await sb.from("profiles").update(next).eq("id", userId).select("*").single();
    if (error) mapSbError(error, "ERROR");
    return mapProfile(data);
  }

  async _storeAvatar(userId, avatarUrl, avatarBlob) {
    if (!avatarUrl && !avatarBlob) return "";
    if (typeof avatarUrl === "string" && avatarUrl.startsWith("http") && !avatarBlob) {
      return avatarUrl;
    }
    const sb = this.requireClient();
    let blob = avatarBlob;
    if (!blob && typeof avatarUrl === "string" && avatarUrl.startsWith("data:")) {
      blob = dataUrlToBlob(avatarUrl);
    }
    if (!blob) return avatarUrl || "";
    const path = `${userId}/avatar.jpg`;
    const { error } = await sb.storage.from("avatars").upload(path, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg",
      cacheControl: "3600",
    });
    if (error) {
      console.error("avatar upload", error);
      throw new Error("UPLOAD_FAILED");
    }
    const { data } = sb.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async getProfile(id) {
    const { sb } = await this.requireUser();
    const { data, error } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) mapSbError(error, "ERROR");
    return mapProfile(data);
  }

  async searchUsers(query) {
    const { sb, userId } = await this.requireUser();
    const q = String(query || "").trim().replace(/[%_,()]/g, "");
    let req = sb
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, last_seen, show_online, show_last_seen, online_status, created_at")
      .neq("id", userId)
      .order("display_name", { ascending: true })
      .limit(40);
    if (q) {
      req = req.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    }
    const { data, error } = await req;
    if (error) mapSbError(error, "ERROR");
    return (data || []).map(mapProfile);
  }

  async listConversations() {
    const { sb } = await this.requireUser();
    const { data, error } = await sb.rpc("list_my_conversations");
    if (error) mapSbError(error, "ERROR");
    return (data || []).map((row) => {
      const last = row.last_message ? mapMessage(row.last_message, this.session?.user?.id) : null;
      return {
        id: row.id,
        other: mapProfile(row.other) || row.other,
        last,
        unread: Number(row.unread) || 0,
        updatedAt: ts(row.updated_at) || 0,
      };
    });
  }

  async getOrCreateConversation(otherUserId) {
    const { sb, userId } = await this.requireUser();
    if (!otherUserId || otherUserId === userId) throw new Error("INVALID");
    const { data, error } = await sb.rpc("get_or_create_direct_conversation", {
      other_user_id: otherUserId,
    });
    if (error) mapSbError(error, "ERROR");
    return { id: data };
  }

  async listMessages(conversationId, { before, limit = MESSAGE_PAGE } = {}) {
    const { sb, userId } = await this.requireUser();
    let req = sb
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) {
      const iso = typeof before === "number" ? new Date(before).toISOString() : before;
      req = req.lt("created_at", iso);
    }
    const { data, error } = await req;
    if (error) mapSbError(error, "FORBIDDEN");
    try {
      await sb.rpc("mark_conversation_delivered", { conv_id: conversationId });
    } catch (err) {
      console.error("delivered", err);
    }
    const rows = (data || []).reverse();
    const mapped = rows.map((row) => mapMessage(row, userId));
    return this._withSignedAttachments(mapped);
  }

  async _withSignedAttachments(messages) {
    const sb = this.requireClient();
    const paths = [
      ...new Set(
        messages
          .map((m) => m.attachmentUrl)
          .filter((u) => u && !/^https?:\/\//i.test(u) && !u.startsWith("data:")),
      ),
    ];
    if (!paths.length) return messages;
    const { data, error } = await sb.storage.from("attachments").createSignedUrls(paths, 60 * 60 * 24);
    if (error) {
      console.error("signed urls", error);
      return messages;
    }
    const map = new Map();
    for (const item of data || []) {
      if (item?.path && item?.signedUrl) map.set(item.path, item.signedUrl);
    }
    return messages.map((m) => {
      if (m.attachmentUrl && map.has(m.attachmentUrl)) {
        return { ...m, attachmentUrl: map.get(m.attachmentUrl), attachmentPath: m.attachmentUrl };
      }
      return m;
    });
  }

  async sendMessage({ conversationId, content, attachment }) {
    const { sb, userId } = await this.requireUser();
    const text = String(content || "").trim();
    if (!text && !attachment) throw new Error("EMPTY");

    let attachmentUrl = null;
    let attachmentName = null;
    let attachmentType = null;
    if (attachment) {
      const uploaded = await this._uploadAttachment(conversationId, userId, attachment);
      attachmentUrl = uploaded.path;
      attachmentName = uploaded.name;
      attachmentType = uploaded.type;
    }

    const { data, error } = await sb
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: text,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
      })
      .select("*")
      .single();
    if (error) mapSbError(error, "ERROR");
    const mapped = mapMessage(data, userId);
    if (attachmentUrl) {
      const signed = await this._withSignedAttachments([mapped]);
      return signed[0];
    }
    return mapped;
  }

  async _uploadAttachment(conversationId, userId, attachment) {
    const sb = this.requireClient();
    let blob = attachment.blob;
    if (!blob && attachment.url?.startsWith("data:")) blob = dataUrlToBlob(attachment.url);
    if (!blob) throw new Error("UPLOAD_FAILED");
    if (blob.size > 4 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
    const rawName = String(attachment.name || "file").replace(/[^\w.\-]+/g, "_");
    const ext = (rawName.split(".").pop() || "bin").slice(0, 8);
    const path = `${conversationId}/${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("attachments").upload(path, blob, {
      upsert: false,
      contentType: attachment.type || blob.type || "application/octet-stream",
    });
    if (error) {
      console.error("attachment upload", error);
      throw new Error("UPLOAD_FAILED");
    }
    return {
      path,
      name: attachment.name || rawName,
      type: attachment.type || blob.type || "application/octet-stream",
    };
  }

  async markRead(conversationId) {
    try {
      const { sb } = await this.requireUser();
      const { error } = await sb.rpc("mark_conversation_read", { conv_id: conversationId });
      if (error) console.error("markRead", error);
    } catch (err) {
      console.error("markRead", err);
    }
  }

  async compressImage(file, max = 1280, quality = 0.72) {
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("UPLOAD_FAILED");
    }
    if (file.size > 4 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("UPLOAD_FAILED"));
        el.src = url;
      });
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("UPLOAD_FAILED"))),
          "image/jpeg",
          quality,
        );
      });
      return {
        blob,
        url: URL.createObjectURL(blob),
        name: (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg",
        type: "image/jpeg",
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async readFile(file) {
    if (!file) throw new Error("UPLOAD_FAILED");
    if (file.size > 4 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
    if (file.type.startsWith("image/")) return this.compressImage(file);
    return {
      blob: file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type || "application/octet-stream",
    };
  }
}

function dataUrlToBlob(dataUrl) {
  const parts = String(dataUrl).split(",");
  const meta = parts[0] || "";
  const b64 = parts[1] || "";
  const mime = (meta.match(/data:(.*?);/) || [])[1] || "application/octet-stream";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function createBackend() {
  return new SupabaseBackend();
}
