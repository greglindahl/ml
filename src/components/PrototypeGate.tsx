import { useState, type FormEvent, type ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCESS_KEY, ACCESS_VERSION, hasRememberedAccess, matchesPasscode } from "@/lib/prototype-access";

export default function PrototypeGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => {
    try { return hasRememberedAccess(window.localStorage); } catch { return false; }
  });
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      if (!(await matchesPasscode(passcode))) {
        setError("Incorrect passcode. Try again.");
        return;
      }
      try { window.localStorage.setItem(ACCESS_KEY, ACCESS_VERSION); } catch { /* Access still works for this visit. */ }
      setPasscode("");
      setUnlocked(true);
    } catch {
      setError("Unable to check the passcode. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <main className="h-screen overflow-y-auto bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <LockKeyhole className="mb-6 h-8 w-8 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold mb-8">ML prototype</h1>
        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="prototype-passcode" className="block text-sm font-medium">Passcode</label>
          <Input id="prototype-passcode" type="password" autoComplete="current-password" autoFocus required
            value={passcode} onChange={event => { setPasscode(event.target.value); setError(""); }}
            aria-invalid={Boolean(error)} aria-describedby={error ? "passcode-error" : undefined} disabled={pending} />
          {error && <p id="passcode-error" role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending || !passcode}>
            {pending ? "Checking…" : "Continue"}
          </Button>
        </form>
      </div>
    </main>
  );
}