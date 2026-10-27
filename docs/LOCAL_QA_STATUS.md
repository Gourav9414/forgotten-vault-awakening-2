# Local QA status — 27 October 2026

## Work completed in this pass

- Replaced the static, sequentially repeated board with a randomized 8×6 virtual-credit board.
- Added source-level cluster detection for groups of at least five orthogonally connected matching non-Wild symbols.
- Added prototype cascade presentation, bet stepper, virtual-credit balance/win HUD, spin button, Auto Play toggle, Turbo toggle, Sound toggle, rules dialog, and feature purchase buttons.
- Added eight distinct Guardian portrait treatments and improved small-screen layout behavior.
- Added a persistent prototype disclaimer: virtual credits only, not real-money gambling, RTP not certified, 100,000× display cap.
- Expanded `scripts/test-prototype.mjs` to check key controls and disclosures.
- Preserved all v104 payout CSVs and compressed game-logic files.

## Static math table arithmetic review

The nine published CSV tables each have 500 rows, unique numeric IDs, no negative payouts/probabilities, and probability sums of approximately 1.00000003. The weighted returns divided by manifest mode costs are approximately 98% for all nine modes. This is a local arithmetic check only; it is not a simulation, independent math audit, official SDK validation, or RTP certification.

## Known blocker requiring reconciliation before release

- The UI/design specifies Extreme Spin at 65× bet, while `math/index.json` currently lists the `extreme-spin` mode cost as 10. The payout CSV weighted return is about 9.8003. These are inconsistent representations of the feature. I have intentionally not changed the v104 payout tables or silently rewritten the math manifest. The game owner must choose/approve which specification is authoritative before release math is considered aligned.
- The standalone HTML demo uses its own illustrative random spin logic and is not wired to the published weighted lookup tables or compressed game logic. Its virtual-credit outcomes must not be treated as evidence of the published RTP.
- This pass has not been run in a real browser or through `npm run build`, `npm run test:prototype`, the local math validators, the official Stake SDK, an RGS, or ACP. The GitHub commit has no CI status checks or workflow runs reported.
- Audio assets are not present; the Sound toggle communicates that limitation rather than playing fabricated audio.
- Guardian portraits are stylized vector-like glyph treatments, not bespoke character illustrations. Final art direction and image assets remain a visual acceptance item.

## User/owner involvement still required

- Run the repo locally and confirm build/test results in the target browser.
- Confirm the Extreme Spin cost conflict (65× design vs 10× manifest mode).
- Complete official Stake SDK/RGS validation, account-bound ACP upload, and any publisher review/approval.
- Review the final visual result against the supplied reference and approve the Guardian artwork.
