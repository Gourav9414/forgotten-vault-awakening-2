import { mount } from 'svelte';
import { RGSClient } from 'stake-engine';
import './app.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app'),
});

// The official SDK reads sessionID, rgs_url, lang and device from the
// operator launch URL. Never construct a separate/hard-coded RGS hostname.
let client = null;
let authenticated = null;
let inFlight = false;
let activeRound = null;

function postToGame(type, payload = {}) {
  const frame = document.querySelector('iframe');
  frame?.contentWindow?.postMessage({ source: 'forgotten-vault-host', type, payload }, window.location.origin);
}

function safeError(error) {
  return error instanceof Error ? error.message : 'Stake Engine request failed.';
}

async function initializeRgs() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('sessionID') || !params.has('rgs_url')) {
    postToGame('RGS_STATUS', {
      ready: false,
      prototype: true,
      message: 'Prototype mode: open this game using a Stake Engine launch URL to authenticate. No real-money play is available here.',
    });
    return;
  }

  try {
    client = RGSClient({ url: window.location.href });
    authenticated = await client.Authenticate();
    activeRound = authenticated.round?.active ? authenticated.round : null;
    postToGame('RGS_STATUS', {
      ready: true,
      balance: authenticated.balance,
      config: authenticated.config,
      jurisdictionFlags: authenticated.jurisdictionFlags,
      activeRound,
      message: activeRound
        ? 'An unfinished round was restored from Stake Engine.'
        : 'Connected to Stake Engine.',
    });
  } catch (error) {
    postToGame('RGS_STATUS', {
      ready: false,
      message: safeError(error),
    });
  }
}

window.addEventListener('message', async (event) => {
  if (event.origin !== window.location.origin || event.source !== document.querySelector('iframe')?.contentWindow) return;
  const message = event.data;
  if (!message || message.source !== 'forgotten-vault-game') return;

  if (message.type === 'RGS_INIT') {
    await initializeRgs();
    return;
  }

  if (message.type === 'RGS_PLAY') {
    if (!client || !authenticated) {
      postToGame('RGS_ERROR', { message: 'Stake Engine session is not authenticated. Launch the game from the operator URL.' });
      return;
    }
    if (inFlight) return;
    if (activeRound?.active) {
      postToGame('RGS_ERROR', { message: 'A round is still active. Finish the current round before starting another.' });
      return;
    }

    const amount = Number(message.payload?.amount ?? authenticated.config.defaultBetLevel);
    const mode = String(message.payload?.mode ?? 'standard');
    if (!Number.isFinite(amount) || amount <= 0) {
      postToGame('RGS_ERROR', { message: 'Invalid bet amount.' });
      return;
    }
    if (amount > authenticated.balance.amount) {
      postToGame('RGS_ERROR', { message: 'Insufficient balance for this bet.' });
      return;
    }

    inFlight = true;
    postToGame('RGS_BUSY', { busy: true });
    try {
      const result = await client.Play({ amount, mode });
      activeRound = result.round?.active ? result.round : null;
      postToGame('RGS_RESULT', {
        balance: result.balance,
        round: result.round,
        // Keep the server-provided state intact for the renderer; do not
        // synthesize a board or payout on the client.
        state: result.round?.state ?? null,
      });

      // Stake Engine closes non-active (including zero-payout) rounds
      // as part of Play. EndRound is only valid for a still-active round.
      if (result.round?.active && Number(result.round?.payout ?? 0) > 0) {
        const ended = await client.EndRound();
        activeRound = null;
        postToGame('RGS_ROUND_ENDED', { balance: ended.balance, round: result.round });
      }
    } catch (error) {
      postToGame('RGS_ERROR', { message: safeError(error) });
    } finally {
      inFlight = false;
      postToGame('RGS_BUSY', { busy: false });
    }
  }

  if (message.type === 'RGS_END_ROUND') {
    if (!client || !activeRound?.active) return;
    if (Number(activeRound.payout ?? 0) <= 0) {
      postToGame('RGS_ERROR', { message: 'Zero-payout rounds are closed by Stake Engine; EndRound was not sent.' });
      return;
    }
    try {
      const ended = await client.EndRound();
      activeRound = null;
      postToGame('RGS_ROUND_ENDED', { balance: ended.balance });
    } catch (error) {
      postToGame('RGS_ERROR', { message: safeError(error) });
    }
  }
});

window.addEventListener('load', () => {
  const frame = document.querySelector('iframe');
  frame?.addEventListener('load', () => postToGame('RGS_HOST_READY'));
});

export default app;
