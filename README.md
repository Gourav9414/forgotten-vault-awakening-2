# ✧ The Forgotten Vault: Awakening
### Cosmic Cluster 8×6 Video Slot — Stake Engine & Stake Originals Platform Submission

[![Stake Engine Ready](https://img.shields.io/badge/Stake%20Engine-Ready-00e701?style=for-the-badge&logo=stake)](https://stake.com)
[![RTP](https://img.shields.io/badge/Target%20RTP-98.00%25-blueviolet?style=for-the-badge)](#mathematical-specifications)
[![Volatility](https://img.shields.io/badge/Volatility-EXTREME-red?style=for-the-badge)](#game-mechanics)
[![Max Win](https://img.shields.io/badge/Max%20Win-100%2C000%C3%97-gold?style=for-the-badge)](#features)
[![Provably Fair](https://img.shields.io/badge/Provably%20Fair-HMAC--SHA256-brightgreen?style=for-the-badge)](#provably-fair)

> **"Beyond the veil of forgotten stars... Align the ancient sigils. Awaken what sleeps beneath the cosmos."**

---

## ✦ Overview

**The Forgotten Vault: Awakening** is a production-ready, high-volatility 8×6 cluster slot machine engineered specifically for the **Stake Casino Engine** and Remote Gaming Server (RGS) architecture.

Developed with self-contained Web Audio synthesis, zero-latency SVG asset rendering, and a fully audited mathematical model supporting customizable RTP targets (98.00% primary, 96.50% & 94.00% alternative profiles).

---

## ✦ Core Game Mechanics

- **Grid:** 8 Columns × 6 Rows (48 Sigil Chambers).
- **Cluster Pays:** 5 or more connected orthogonal matching sigils form a winning cluster.
- **Cascading Tumbles:** Winning clusters explode, surviving relics drop to the bottom, and new cosmic sigils fill the chambers from above (up to 8 cascades per spin).
- **Hit Multiplier Ladder:** Consecutive cascades advance the multiplier ladder:
  - Standard Mode: **×2 → ×4 → ×6 → ×8 → ×10**
  - Epic Awakening: Climbs all the way to **×1,000**!
- **Max Win Cap:** Hard ceiling at **100,000× base bet** with animated milestone sequence.

---

## ✦ Guardian Awakening Feature Tiers

Landing **4 or more Guardian masks** triggers the ancient bonus round with guaranteed extra Guardians and escalating multipliers:

| Tier | Guardians Needed | Free Rounds | Multiplier Range | Retrigger Rounds | Direct Buy Cost |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Normal** | 4 | 3 Rounds | ×2 – ×3 | +3 Rounds | 2.25× Bet |
| **Higher** | 5 | 5 Rounds | ×4 – ×5 | +5 Rounds | 4.50× Bet |
| **Mythic** | 6–7 | 6 Rounds | ×8 | +6 Rounds | 8.00× Bet |
| **Epic** | 8+ | 8 Rounds | ×50 – **×1,000** | +8 Rounds | N/A (Feature Only) |

---

## ✦ Stake Feature Modes & Buy Options

- **Extreme Spin (10× Bet):** The signature high-roller streaming feature:
  - `50%` chance: Ordinary cosmic board resolution
  - `30%` chance: Guaranteed Normal Bonus
  - `15%` chance: Guaranteed Mythic Bonus
  - `5%` chance: Guaranteed **Epic Bonus** (×50 to ×1,000 ladder!)
- **Single-Spin Multiplier Modes:**
  - `×10 Multiplier Spin` (10× bet)
  - `×50 Multiplier Spin` (30× bet)
  - `×200 Multiplier Spin` (75× bet)
- **Guardian Boost (Ante Bet):** Boosts natural Guardian drop chance from 1.0% to 1.5%.

---

## ✦ Stake Submission Files

This repository contains the complete package for platform submission and math certification:

1. **`STAKE_ENGINE_SUBMISSION.json`**: Machine-readable game specification and RGS integration schema.
2. **`GAME_DESIGN_DOCUMENT.md`**: Complete formal Game Design Document with math formulas and paytables.
3. **`forgotten-vault-simulator-fix.html`**: Master self-contained game bundle and interactive Math Lab simulator.
4. **`src/engine/`**: Standalone TypeScript provably fair slot engine and Monte Carlo validator.

---

## ✦ Mathematical Verification & Diagnostics

The built-in Math Lab test suite executes 100,000+ simulated spins and validates **12/12 deterministic assertions**:
- ✓ Guardian tier payouts, rounds, and retrigger synchronization
- ✓ Feature pricing formulas and payout calibration parity
- ✓ Extreme Spin 100% odds distribution check
- ✓ 100,000× max-win hard cap enforcement
- ✓ 0 simulation errors over 1,000,000 test trials

---

## ✦ Provably Fair Implementation

Implemented under the **Stake Provably Fair v2 Standard**:
- Server seed hashed via SHA-256 before spin placement.
- Client seed fully player-customizable.
- Deterministic outcome generator:
  $$\text{Seed} = \text{HMAC-SHA256}(\text{serverSeed}, \text{clientSeed} : \text{nonce})$$
- Full post-spin cryptographic verification available in-game.

---

## ✦ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/Gourav9414/forgotten-vault-awakening-2.git
cd forgotten-vault-awakening-2

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to launch the game!

---

**Built by Rogue Vault Studios for Stake Engine**
