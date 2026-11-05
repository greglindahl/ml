# Architecture rules

- Wrap all prototype routes in the client-only PrototypeGate; this intentionally discourages casual visitors and must never be described as authentication or real security.
- Persist the passcode digest version rather than the plaintext passcode in browser storage so unchanged-code releases preserve access and code changes invalidate remembered access.