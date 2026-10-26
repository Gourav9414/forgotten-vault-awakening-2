# Local Math Table Audit (automated structural calculation)

**Date:** 2026-10-27  
**Scope:** Read-only review of the 9 CSV lookup tables referenced by `math/index.json`. No payout table was changed.  
**Status:** Local arithmetic/structure check only — not official Stake SDK validation, compressed game-logic verification, or independent RTP certification.

## Results

The audit computes `sum(probability)` and `sum(payout × probability)` from each CSV's current `id,payout,probability` columns. Expected return is divided by the manifest mode cost to calculate the mode return ratio.

| Mode | Cost | Rows | Probability sum | Weighted return | Return / cost | Max table payout |
|---|---:|---:|---:|---:|---:|---:|
| standard | 1× | 500 | 1.00000003 | 0.979919 | 97.9919% | 1537.66× |
| ante | 1× | 500 | 1.00000003 | 0.979937 | 97.9937% | 2300.15× |
| multi10 | 10× | 500 | 1.00000003 | 9.800023 | 98.0002% | 11016.82× |
| multi50 | 30× | 500 | 1.00000003 | 29.399868 | 97.9996% | 22563.69× |
| multi200 | 75× | 500 | 1.00000003 | 73.499939 | 97.9999% | 33876.59× |
| buy-normal | 2.25× | 500 | 1.00000003 | 2.205118 | 98.0052% | 3933.48× |
| buy-higher | 4.5× | 500 | 1.00000003 | 4.410173 | 98.0038% | 12027.33× |
| buy-mythic | 8× | 500 | 1.00000003 | 7.840026 | 98.0003% | 19235.31× |
| extreme-spin | 10× | 500 | 1.00000003 | 9.800314 | 98.0031% | 17607.20× |

## Structural checks

- **standard:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **ante:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **multi10:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **multi50:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **multi200:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **buy-normal:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **buy-higher:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **buy-mythic:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.
- **extreme-spin:** 500 rows; IDs strictly increasing: yes; payout/probability non-negative: yes; max payout below 100,000×: yes.

- Every table has probability total approximately 1.00000003, consistent with small decimal rounding.
- The table-level weighted return ratios are close to the 98% target for all modes.
- This does **not** establish that the tables map correctly to the compressed `.jsonl.zst` game logic, that the frontend follows these tables, or that the official RGS will produce these outcomes.
- The compressed logic files are binary. This source-only connector could not decode them as UTF-8, so their contents were not inspected here.
- The existing v104 tables are intentionally left unchanged.
