# Verification record

24 October 2026, local workspace, no provider credentials configured.

- `npm test`: five schema/evidence tests pass (compiler, invalid role-play/language, patch, grader shape, exact student quote verification and score caps).
- `npm run typecheck`: strict TypeScript passes.
- `npm run build`: production build passes with Next.js 16 / Webpack. Webpack is selected explicitly because sandboxed Turbopack's CSS worker requires a blocked local port.
- `npm run test:smoke`: passes creation, private link denial, edit, version history, restore, publish, exclusion of private configuration from public JSON, simulated session saving, zero-score offline grading, historical configuration snapshot, dashboard retrieval, invalid input rejection and disposable record cleanup.
- Dependency audit: zero vulnerabilities after updating Next.js, Zod, and transitive PostCSS/deepmerge-ts. Prisma remains on 6.x for its SQLite client contract; the deepmerge override is exercised by schema generation and db push.
- Browser QA: responsive homepage, starter selection, creation navigation, scripted test transcript, session saving, dashboard metrics/table, and labeled seeded rubric/evidence view inspected.
- Four seed agents and one illustrative graded transcript created locally. Seed is idempotent by agent name and can activate an existing offline seed when ElevenLabs credentials are later added.

Not verified: paid/credential-dependent API execution (ElevenLabs create/update/delete, signed live microphone call, TTS, Scribe, Voice Design, authoritative conversation import) or Claude compilation/refinement/grading. Server wrappers follow the linked current docs, but account permissions, models, voice IDs and API behavior must be checked with real credentials before a live judging demo. No real phone calls are made.

## Frontend personalization update

- Redesigned as a warm rehearsal notebook with daylight/evening themes.
- Browser-checked profile editing, personalized greeting, theme switching, scenario-to-brief selection, challenge-to-preview updates, draft restoration after reload, assistant-specific starters, and saving a private journal note. Temporary QA names/notes were cleared.
- Challenge and agent-kind choices are checked by the journey smoke test against the persisted configuration.
- Production build, strict TypeScript and the schema tests pass after the frontend update.
