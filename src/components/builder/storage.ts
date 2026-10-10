import { type DesignerState, pack, unpack } from "@/components/builder/state";

// Where a design lives between visits: the browser's own storage for the
// draft, and the URL hash for a link to send on. There is no server.

const DRAFT_KEY = "lumora-designer-v1";
const RECENT_KEY = "lumora-designer-recent";
const HASH_PREFIX = "#d=";

const makeId = () => crypto.randomUUID();

const readJson = (text: string | null | undefined): unknown => {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};

const loadDraft = (): DesignerState | undefined => {
  try {
    return unpack(readJson(localStorage.getItem(DRAFT_KEY)), makeId);
  } catch {
    return undefined;
  }
};

const saveDraft = (state: DesignerState) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(pack(state)));
  } catch {
    // Private mode or a full store: the draft is simply not kept.
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
};

// The last few custom colours picked, newest first.
const loadRecentColors = (): readonly string[] => {
  try {
    const value = readJson(localStorage.getItem(RECENT_KEY));

    return Array.isArray(value) ?
        value.filter(
          (item): item is string =>
            typeof item === "string" && /^#[\da-f]{6}$/i.test(item),
        )
      : [];
  } catch {
    return [];
  }
};

const saveRecentColors = (colors: readonly string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(colors));
  } catch {
    // Not kept.
  }
};

// base64url of the compact JSON, so the link survives chat apps and email.
const encodeHash = (state: DesignerState) => {
  const bytes = new TextEncoder().encode(JSON.stringify(pack(state)));
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join(
    "",
  );

  return `${HASH_PREFIX}${btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")}`;
};

const decodeHash = (hash: string): DesignerState | undefined => {
  if (!hash.startsWith(HASH_PREFIX)) return undefined;
  try {
    const base64 = hash
      .slice(HASH_PREFIX.length)
      .replaceAll("-", "+")
      .replaceAll("_", "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);

    return unpack(readJson(new TextDecoder().decode(bytes)), makeId);
  } catch {
    return undefined;
  }
};

export {
  clearDraft,
  decodeHash,
  encodeHash,
  loadDraft,
  loadRecentColors,
  makeId,
  saveDraft,
  saveRecentColors,
};
