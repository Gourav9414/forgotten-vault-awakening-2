# Stake Engine Readiness Audit

**Audit date:** 2026-10-28  
**Repository:** `Gourav9414/forgotten-vault-awakening-2`  
**Working branch:** `work/stake-engine-readiness`  
**Scope:** Read-only source inspection before implementation. No payout tables or existing files were changed by this audit.

## Executive result

The repository is a visual prototype and local math publication candidate, not yet a Stake Engine-ready package. Preserve the current v104 payout tables and 8×6 cosmic design while fixing the integration and packaging gaps.

## Verified from current source

- `forgotten-vault.html` renders an 8×6 board, but its inline script only places decorative tiles. It does not wire working spin, bet, autoplay, sound, or feature controls.
- The standalone HTML imports Cinzel and Inter from Google Fonts. This is an external-host dependency and must be removed or replaced with locally bundled fonts for a static-only package.
- `App.svelte` wraps the standalone HTML in an iframe. The visible application is therefore not currently using the Svelte app as the game logic layer.
- `math/index.json` declares nine modes and points to nine lookup CSVs and nine compressed game-logic files.
- The current lookup CSV uses `id,payout,probability`, not the publication header expected by the documented Stake Engine checklist (`id,weight,payoutMultiplier`, payout multiplier scaled by 100). The existing normalizer changes the numeric representation and must not be run blindly: its output should be checked against the official SDK and the books/logic files first.
- `scripts/validate-math-official.mjs` explicitly says it is a local structural validator, not the official Stake Engine SDK validator.
- `scripts/test-prototype.mjs` expects element IDs and handlers such as `spin`, `betDown`, `autoToggle`, `async function runSpin`, and `findClusters`; those are not present in the currently inspected `forgotten-vault.html`. The test likely fails against the current source and needs to be run in a checkout before claiming a pass.
- `STAKE_ENGINE_SUBMISSION.json` describes a custom spin endpoint and provably-fair scheme, but this does not prove those endpoints exist in Stake Engine RGS. Treat it as project metadata, not an authoritative API contract.
- The repository's own README correctly states that official SDK math validation, complete authoritative outcome rendering, ACP upload, and approval remain pending. An initial official-client authentication/play bridge has now been added on the working branch; it has not been exercised against a live RGS session.

## Implementation order

1. **Protect the math:** keep all v104 lookup values unchanged. Obtain a reproducible official SDK validation result and reconcile lookup tables with compressed game-logic books before publication-format conversion.
2. **Wire the real client lifecycle:** use the official Stake Engine client integration for launch parameters, authentication, balance, play, round continuation/end-round, error handling, and currency units. Never use client-side random outcomes for real-money play.
3. **Render authoritative outcomes:** map RGS round state/events to the existing board and animations without changing the payout model.
4. **Remove external runtime dependencies:** bundle/localize fonts and confirm all game assets load from the game package.
5. **Run tests:** execute local tests and build; add targeted checks for launch URL validation, RGS errors, active-round resume, zero-payout handling, insufficient balance, currency formatting, and replay.
6. **Stake Engine dashboard:** upload the validated publication package only after the local and official SDK checks pass; then run the dashboard's approval flow.

## Not yet verified

- No official Stake Engine SDK validation has been run from this repository.
- No local checkout/build/test command was executed during this source-only audit.
- The compressed `.jsonl.zst` book files were not decoded or cross-checked against lookup tables.
- No real RGS session or test-launch URL was available, so authentication, wallet calls, active-round resume, and replay have not been integration-tested.
- No RTP certification or production approval is claimed.

## Safety constraints

- Do not change the existing payout factors without explicit approval.
- Do not expose session IDs or credentials in source control.
- Do not call the dashboard approval action until the official package and real RGS flow have passed testing.
