import { useEffect, useState } from "react";

/**
 * Design-review switches for comparing prototype variants side by side.
 *
 * A variant is picked with a URL param (shareable: paste the link in Slack) and
 * then remembered in localStorage, so it survives navigating around. Pass the
 * default value in the URL to switch back. useScreenSlug keeps these params in
 * the address bar when it rewrites ?screen / &tab.
 *
 *   ?savedFilters=button   Activity saved filters, option A (default)
 *   ?savedFilters=views    Activity saved filters, option B (views bar)
 */
export const PROTO_VARIANTS = {
  savedFilters: ["button", "views"],
} as const;

export type ProtoVariantKey = keyof typeof PROTO_VARIANTS;
export type ProtoVariant<K extends ProtoVariantKey> = (typeof PROTO_VARIANTS)[K][number];

const storageKey = (key: string) => `proto.variant.${key}`;

function read<K extends ProtoVariantKey>(key: K): ProtoVariant<K> {
  const allowed = PROTO_VARIANTS[key] as readonly string[];
  const fromUrl = new URLSearchParams(window.location.search).get(key);
  if (fromUrl && allowed.includes(fromUrl)) return fromUrl as ProtoVariant<K>;
  try {
    const stored = localStorage.getItem(storageKey(key));
    if (stored && allowed.includes(stored)) return stored as ProtoVariant<K>;
  } catch {
    // Storage unavailable — fall through to the default.
  }
  return allowed[0] as ProtoVariant<K>;
}

/** Read once on mount; switching variants is a reload with a different URL. */
export function useProtoVariant<K extends ProtoVariantKey>(key: K): ProtoVariant<K> {
  const [variant] = useState(() => read(key));
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(key), variant);
    } catch {
      // Not remembered — the URL param still works.
    }
  }, [key, variant]);
  return variant;
}

/** Params useScreenSlug must carry over when it rewrites the address bar. */
export const PROTO_VARIANT_PARAMS = Object.keys(PROTO_VARIANTS);
