# Official Stake Engine Math Audit — Initial Findings

Date: 2026-10-29  
Branch: `math/official-sdk-audit`  
Scope: static review of `math/index.json`, all nine lookup CSVs, and the official Stake Engine Math SDK file-format documentation.

## Status

**BLOCKED — do not upload this math package as production-ready.** These are repository-level findings, not official SDK validation or RTP certification.

Official format references:
- https://stake-engine.com/docs/math/quick-start
- https://engineio.github.io/math-sdk/rgs_docs/data_format/

## Confirmed findings

### 1. Lookup CSV schema is not in the documented publication format

All nine lookup CSVs use the header:

```csv
id,payout,probability
```

The documented publication format is three unsigned integer fields in this order: simulation ID, selection probability/weight, payout multiplier. The payout multiplier must match the `payoutMultiplier` value for the same ID in the compressed JSONL book.

Current CSV payouts and probabilities are decimal floating-point values. Do **not** fix this by simply swapping columns or rounding values: publication files must be regenerated or converted only after the authoritative payout units and book values are verified.

### 2. Local weighted payout arithmetic is close to 98%, but does not prove RTP

The CSV probabilities sum to approximately 1.00000003 in each mode. Using the current decimal columns, the probability-weighted payout and mode cost produce:

| Mode | Configured cost | Weighted payout from CSV | Implied return |
|---|---:|---:|---:|
| standard | 1.00× | 0.979919 | 97.9919% |
| ante | 1.00× | 0.979937 | 97.9937% |
| multi10 | 10.00× | 9.800023 | 98.0002% |
| multi50 | 30.00× | 29.399868 | 97.9996% |
| multi200 | 75.00× | 73.499939 | 97.9999% |
| buy-normal | 2.25× | 2.205118 | 98.0052% |
| buy-higher | 4.50× | 4.410173 | 98.0038% |
| buy-mythic | 8.00× | 7.840026 | 98.0003% |
| extreme-spin | 10.00× | 9.800314 | 98.0031% |

These are arithmetic summaries of the current CSVs only. They do **not** establish that the books match the CSVs, that payouts are represented in official integer units, or that the actual game rules/RGS outcomes achieve this RTP.

### 3. Ante cost appears inconsistent with the intended design

The current `math/index.json` sets `ante.cost = 1.0`. The project's stated design requirement has been a 1.5× ante cost. The ante mode's 98% weighted payout calculation currently assumes a 1.0× cost. Before changing anything, the team must decide whether ante is intended to cost 1.0× or 1.5×; if 1.5× is intended, the ante outcome distribution and payout math must be recalculated together.

### 4. Index file includes non-standard metadata

Each mode contains aliases such as `lookup`, `table`, `book`, `events`, `weights`, and `game_logic`. The documented minimum publication schema uses `name`, `cost`, `events`, and `weights` within each mode. Extra metadata may be ignored by some readers, but the final publication index should be generated in the exact supported schema rather than relying on permissive parsing.

### 5. Compressed-book parity remains unverified

The `.jsonl.zst` files exist and have Zstandard-looking base64 prefixes, but this audit has not decompressed all books and compared every book record's integer `id` and `payoutMultiplier` against its corresponding lookup row. This is a required blocker before publication.

## Required next actions

1. Pin the official Math SDK version/commit and run its own verification utility on a clean publication directory.
2. Decompress every mode's book; verify each record has the required `id`, `events`, and integer `payoutMultiplier` fields.
3. Match every book ID to exactly one lookup row and verify the integer payout multiplier matches exactly.
4. Generate official integer-weight/integer-payout CSVs and a minimal supported `index.json` from the authoritative books. Do not hand-round the current decimal CSVs.
5. Resolve ante cost intent (1.0× versus 1.5×) and regenerate/optimize that mode accordingly.
6. Run SDK simulations/optimization and review the resulting PAR/statistical report before claiming RTP.

## Guardrails

- Keep the current browser prototype and payout calibration unchanged while auditing.
- Do not describe the 98% target as verified RTP.
- Do not claim official SDK acceptance or Stake Engine submission readiness until the SDK verification and book/lookup parity checks pass.
