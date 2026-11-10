# Architecture rules

- Keep the client-only PrototypeGate passcode screen in the codebase but unmounted by default; when re-enabled it must wrap all prototype routes and must never be described as authentication or real security.
- Persist the passcode digest version rather than the plaintext passcode in browser storage so unchanged-code releases preserve access and code changes invalidate remembered access.