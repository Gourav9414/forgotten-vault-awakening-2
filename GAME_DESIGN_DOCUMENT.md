# THE FORGOTTEN VAULT: AWAKENING
## Formal Game Design Document (GDD) & Technical Math Model
### Stake Engine & Stake Originals Platform Submission

**Studio:** Rogue Vault Studios  
**Game Identifier:** `forgotten-vault-awakening-2`  
**Game Type:** 8×6 Cosmic Cluster Pays Cascading Slot  
**Target Platform:** Stake Casino Engine / Remote Gaming Server (RGS)  
**Target RTP:** 98.00% (with 96.50% & 94.00% jurisdictional profiles)  
**Volatility Rating:** EXTREME  
**Maximum Exposure Cap:** 100,000× Base Bet  

> Validation status: this repository contains a local publication bundle and prototype logic for internal review only. Official Stake Engine SDK validation, ACP upload, and RGS compliance checks remain pending.

---

## 1. Executive Summary & Pitch

**The Forgotten Vault: Awakening** is an intense, high-volatility cosmic slot machine that merges ancient cosmic artifact mythology with modern cluster-cascade dynamics. Set across 48 Sigil Chambers, the game uses stacked archetypal wins, cascading tumbles and escalating bonus triggers designed for high-roller Stake-style entertainment.

### Key Innovations for Stake Players:
1. **8×6 Cosmic Cluster Pays:** Any 5 or more horizontally or vertically adjacent matching sigils form a winning cluster. Winning sigils burst, tumble downward, and draw fresh cosmic relics from above.
2. **Guardian Awakening System:** Landing 4 or more Guardian masks unlocks escalating bonus tiers.
3. **Extreme Spin Mode (10× Bet):** Designed for high-roller Stake streaming entertainment.
4. **Multiplier Modes & Direct Bonus Buys:** Instant feature buy access from 2.25× up to 75× bet for single-spin persistent multipliers (×10, ×50, ×200).

---

## 2. Grid & Mechanics Specification

| Parameter | Value |
| :--- | :--- |
| **Grid Dimensions** | 8 Columns × 6 Rows (48 Total Chambers) |
| **Win Evaluation** | Orthogonal Cluster Pays (Minimum 5 adjacent matching tiles) |
| **Cascade Limit** | Up to 8 consecutive cascades per spin |
| **Wild Symbol** | Wild Vortex (substitutes for all regular paying symbols) |
| **Zap Arrival** | Dynamic wild transformation during cascade sequences |
| **Guardian Symbol** | Violet stone mask with glowing eyes & gold border |
| **Base Guardian Drop Rate** | 1.0% per chamber (1.5% with Guardian Boost Ante) |
| **Bonus Guardian Drop Rate** | 0.5% per chamber (+1 guaranteed starting Guardian per round) |

---

## 3. Hit Multiplier Ladder Matrix

Consecutive winning cascades climb the chamber's Multiplier Ladder. Progress carries forward during cascades, and required cascades increment by 1 after each tier:

### Standard Ladder:
- Level 1: **×2** (Starting base)
- Level 2: **×4** (Requires 2 cascades)
- Level 3: **×6** (Requires 3 cascades)
- Level 4: **×8** (Requires 4 cascades)
- Level 5: **×10** (Requires 5 cascades — Standard Cap)

### Epic Awakening Ladder:
- Steps: **×50 → ×100 → ×200 → ×300 → ×500 → ×750 → ×1,000**
- Hard cap at **×1,000** multiplier per cluster!

---

## 4. Stake Feature Buy & Mode Matrix

| Mode Name | Cost (× Bet) | Mechanic / Reward |
| :--- | :---: | :--- |
| **Standard Spin** | 1.0× | Standard game with 1.0% Guardian drop rate |
| **Guardian Boost (Ante)** | 1.0× | Increases Guardian drop rate by 50% (to 1.5%) |
| **×10 Multiplier Spin** | 10.0× | Applies persistent ×10 multiplier to all cluster wins |
| **×50 Multiplier Spin** | 30.0× | Applies persistent ×50 multiplier to all cluster wins |
| **×200 Multiplier Spin** | 75.0× | Applies persistent ×200 multiplier to all cluster wins |
| **Normal Bonus Buy** | 2.25× | Direct unlock of 4-Guardian Normal Awakening (3 rounds) |
| **Higher Bonus Buy** | 4.50× | Direct unlock of 5-Guardian Higher Awakening (5 rounds) |
| **Mythic Bonus Buy** | 8.00× | Direct unlock of 6-Guardian Mythic Awakening (6 rounds) |
| **Extreme Spin** | 10.0× | High-volatility lottery (50% Board, 30% Normal, 15% Mythic, 5% Epic) |

---

## 5. Mathematical Calibration & Simulation Diagnostics

This repository contains a local Math Lab diagnostic test suite intended for internal review and publication bundle checks. The release is not yet certified by the official Stake SDK or ACP workflow.

The current local validation status is:

- **Target Return to Player (RTP):** 98.00% (design target only)
- **Hit Frequency:** ~28.6% (design target only)
- **Max Win Cap:** 100,000× base bet (design target only)
- **Official SDK validation:** Pending
- **RGS compliance validation:** Pending
- **ACP upload acceptance:** Pending

---

## 6. Stake Provably Fair Compliance

The game design intends to align with the **Stake Provably Fair v2 Standard**:

```
hash = HMAC_SHA256(serverSeed, clientSeed + ":" + nonce)
```

1. **Pre-Spin Commitment:** The SHA-256 hash of the server seed is delivered to the client prior to placing the wager.
2. **Client Seed Freedom:** The player may customize their client seed at any time.
3. **Deterministic Verification:** Once the server seed is revealed, the player can verify the board, cascades, and cluster payout using the built-in verification process.

The repository is intended as a public-facing prototype and not as a certified production deployment until the official Stake validation process is complete.

---

## 7. Stake RGS API Integration Schema

### Endpoint: `POST /api/v1/games/forgotten-vault/spin`

#### Sample Request:
```json
{
  "currency": "USDT",
  "betAmount": 10.0,
  "clientSeed": "stake_user_seed_98a7f",
  "mode": "extreme-spin"
}
```

#### Sample Response:
```json
{
  "id": "vault_round_998124",
  "nonce": 128,
  "serverSeedHash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  "currency": "USDT",
  "betAmount": 10.0,
  "totalPayout": 850.0,
  "multiplier": 85.0,
  "featureWon": "epic",
  "cascades": 6,
  "maxWinReached": false
}
```

---

## 8. Summary for Stake Review Team

**The Forgotten Vault: Awakening** is a self-contained prototype and publication bundle intended for local validation, engineering review and future ACP submission. It is not yet a production-certified Stake Engine deployment. Official SDK validation, ACP acceptance, and RGS integration approval remain pending.
