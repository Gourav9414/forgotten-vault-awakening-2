# ✧ The Forgotten Vault: Awakening

**Cosmic fantasy cluster-slot prototype · 8 columns × 6 rows · Virtual credits only**

> **Release status:** Work in progress. This repository is not a certified production Stake Engine deployment. Official Stake SDK validation, authoritative RGS integration, ACP upload, and approval remain pending. The 98% RTP is a target, not a verified result.

![Status](https://img.shields.io/badge/Release-Prototype-orange?style=for-the-badge)
![Target RTP](https://img.shields.io/badge/Target%20RTP-98%25-blueviolet?style=for-the-badge)
![Max win cap](https://img.shields.io/badge/Prototype%20cap-100%2C000%C3%97-gold?style=for-the-badge)

> “Beyond the veil of forgotten stars... Align the ancient sigils. Awaken what sleeps beneath the cosmos.”

## Current prototype

- **Main playable entry:** `forgotten-vault.html` is now the v110 mobile-spin-fix build (promoted on 2026-10-29). This remains a standalone virtual-credit prototype, not an RGS-integrated release.

- **Board:** 8 columns × 6 rows (48 tiles).
- **Wins:** clusters of 5 or more matching symbols connected orthogonally.
- **Cascades:** winning symbols are removed and replaced.
- **Guardian tiers:** Normal (4), Hyper (5), Mythic (6–7), and Epic (8+). Epic is gameplay-triggered and cannot be purchased.
- **Feature modes:** Guardian Boost, single-spin ×10/×50/×200 modes, bonus buys, and Extreme Spin.
- **Max-win display:** 100,000× prototype cap.
- **Credits:** virtual credits only. No deposits, withdrawals, or real-money payouts.

## Repository entry points

- `forgotten-vault.html` — current standalone playable prototype.
- `assets/cosmic-vault-cinematic.svg` — vector environment artwork.
- `math/index.json` — local math publication candidate manifest.
- `math/lookup_tables/` — mode lookup tables.
- `math/game_logic/` — compressed game-logic data.
- `scripts/validate-math.mjs` — local structural checks for publication files.
- `scripts/validate-math-official.mjs` — local manifest/path check only; it is **not** the official Stake SDK validator.
- `scripts/normalize-math-publication.mjs` — lookup-table publication normalization utility.

## Local use

Open `forgotten-vault.html` in a modern browser for the standalone virtual-credit prototype.

For the repository's Node-based math utilities:

```bash
npm install
npm run validate:math
npm run validate:math:official
```

These commands are local checks, not official SDK validation or RTP certification. Run them from the repository root. Inspect every reported warning or failure before preparing a submission. GitHub Actions also runs a frontend build, prototype regression checks, and local math validations on pushes and pull requests.

## Math and release readiness

- **RTP target:** 98%; not verified or certified.
- **Current math status:** `PENDING_OFFICIAL_STAKE_SDK_VALIDATION`.
- **Payout calibration:** v104 candidate is intentionally held unchanged unless explicitly requested.
- **RGS:** the standalone HTML prototype is not a substitute for an authoritative RGS integration.
- **Official submission:** SDK schema/format validation, lookup-to-logic consistency, RGS compliance, ACP upload, and approval remain to be completed.

## Important limitations

The standalone browser prototype and the math publication candidate are separate parts of the project. A successful spin in the browser does not prove that the published lookup tables, compressed game logic, RTP, or official RGS flow are correct. No production-readiness, certification, or provably-fair guarantee should be inferred from this repository until the corresponding independent checks pass.

---

**Project:** The Forgotten Vault: Awakening  
**Studio label:** Rogue Vault Studios  
**Repository:** https://github.com/Gourav9414/forgotten-vault-awakening-2
