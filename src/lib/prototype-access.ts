// This is a casual UI gate, not authentication or access control.
export const ACCESS_KEY = "ml-prototype-access";
export const ACCESS_VERSION = "a304f57e05f2a1d26090ac2cb40e12072c191ba25d34c15eb21a4dcdbf732c21";

export async function matchesPasscode(value: string): Promise<boolean> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return hash === ACCESS_VERSION;
}

export function hasRememberedAccess(storage: Pick<Storage, "getItem">): boolean {
  try {
    return storage.getItem(ACCESS_KEY) === ACCESS_VERSION;
  } catch {
    return false;
  }
}