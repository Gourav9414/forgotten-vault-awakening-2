const params = new URLSearchParams(window.location.search);
const replayId = params.get('replay') || params.get('roundId') || params.get('event');
const replayMode = params.get('mode') || 'standard';
const replayGame = params.get('game') || 'forgotten-vault-awakening-2';
const replayVersion = params.get('version') || '1.0.4';
const rgsUrl = params.get('rgs_url') || '';
let replayInProgress = false;
let replayRequestInFlight = false;

async function fetchRgsOutcomeForReplay({ id, game, version, mode, event, rgsUrl: baseUrl }) {
  if (!baseUrl) return null;
  const url = new URL('/api/v1/games/' + game + '/replay', baseUrl);
  url.searchParams.set('replay', id || event || '');
  url.searchParams.set('game', game);
  url.searchParams.set('version', version || '1.0.4');
  url.searchParams.set('mode', mode || 'standard');
  url.searchParams.set('event', event || id || '');
  const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
  if (!response.ok) throw new Error('RGS replay request failed: ' + response.status);
  return response.json();
}

async function replayRoundById(roundId, fromSessionOnly = false) {
  if (replayInProgress || replayRequestInFlight) return;
  replayRequestInFlight = true;
  try {
    const found = stakeRoundHistory.find((r) => r.id === roundId);
    if (found && !fromSessionOnly) {
      replayInProgress = true;
      await playReplayRound(found);
      replayInProgress = false;
      return found;
    }

    if (rgsUrl) {
      const payload = await fetchRgsOutcomeForReplay({
        id: roundId,
        game: replayGame,
        version: replayVersion,
        mode: replayMode,
        event: roundId,
        rgsUrl: rgsUrl
      });
      if (payload) {
        replayInProgress = true;
        toast('RGS replay payload received.');
        if (payload.board && Array.isArray(payload.board)) {
          board = payload.board.map((row) => row.map((symbol) => S.find((s) => s.id === symbol) || S[0]));
          render();
        }
        if (payload.payoutMultiplier !== undefined) {
          last = Number(payload.payoutMultiplier || 0);
        }
        replayInProgress = false;
        return payload;
      }
    }

    if (found) {
      replayInProgress = true;
      await playReplayRound(found);
      replayInProgress = false;
      return found;
    }

    toast('Round ID ' + roundId + ' not found in session memory or RGS replay response.');
    return null;
  } finally {
    replayRequestInFlight = false;
    replayInProgress = false;
  }
}

window.StakeEngine = {
  version: '1.0.4',
  specification: 'Stake Engine v2.0',
  replayRound: async (id) => replayRoundById(id, false),
  fetchOutcome: async (payload) => {
    if (!rgsUrl) {
      toast('No RGS URL configured for authoritative outcome fetch.');
      return null;
    }
    const response = await fetch(new URL('/api/v1/games/' + replayGame + '/spin', rgsUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        game: replayGame,
        version: replayVersion,
        mode: payload?.mode || replayMode,
        betAmount: payload?.betAmount || bet,
        currency: payload?.currency || 'USDT',
        clientSeed: payload?.clientSeed || 'local-seed',
        nonce: payload?.nonce || Date.now()
      })
    });
    if (!response.ok) {
      throw new Error('RGS fetchOutcome failed: ' + response.status);
    }
    return response.json();
  },
  playOutcome: async (outcomePayload) => {
    if (busy) return;
    toast('CONSUMING RGS OUTCOME');
    busy = true;
    const boardPayload = outcomePayload?.board || outcomePayload?.state || [];
    if (Array.isArray(boardPayload) && boardPayload.length) {
      board = boardPayload.map((row) => row.map((symbol) => S.find((s) => s.id === symbol) || S[0]));
      render();
    }
    await animateSpin(1000);
    balance += Number(outcomePayload?.payout || outcomePayload?.totalWin || 0);
    last = Number(outcomePayload?.payout || outcomePayload?.totalWin || 0);
    busy = false;
    ui();
  },
  getHistory: () => stakeRoundHistory
};

function guardReplay(state) {
  if (state && replayInProgress) {
    return true;
  }
  return false;
}

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const replayId = params.get('replay') || params.get('roundId') || params.get('event');
  if (replayId) {
    setTimeout(() => replayRoundById(replayId), 1000);
  }
});

const originalSpin = spin;
async function guardedSpin(mode = 'standard') {
  if (replayInProgress) {
    toast('Betting is disabled while replay is active.');
    return;
  }
  return originalSpin(mode);
}
spin = guardedSpin;

const originalReplaySubmit = document.getElementById('replaySubmitBtn')?.onclick;
document.getElementById('replaySubmitBtn').onclick = () => {
  const val = document.getElementById('replayInput').value.trim();
  if (val) {
    replayRoundById(val);
  }
};
