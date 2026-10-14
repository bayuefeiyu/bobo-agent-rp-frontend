import { randomUUID } from 'node:crypto';
import { API_VERSION, HOST_VERSION, RpWebError, normalizeReadContext } from '../packages/rp-web-contract/index.mjs';
import { validateOperationRequest, validateOperationResponse } from '../packages/rp-web-contract/operations.mjs';
import { card, getScenario, scenarios } from '../fixtures/scenarios.mjs';

export const mockCapabilities = {
  play: ['connection', 'get.card', 'get.state', 'post.opening', 'post.input', 'put.messages.sequence'],
  launcher: ['connection', 'get.cards'],
};
export function createMockService({ service = 'play', scenario = 'empty' } = {}) {
  if (!mockCapabilities[service]) throw new Error('Unknown service.');
  let fixture, state, serverInstanceId, fault = null;
  const receipts = new Map();
  function reset(id) {
    fixture = getScenario(id); state = fixture.state; serverInstanceId = randomUUID();
    receipts.clear(); fault = null;
  }
  reset(scenario);
  const context = () => ({ serverInstanceId, cardId: service === 'launcher' ? null : card.id, chatId: service === 'launcher' ? null : state.sessionId, executionId: null });
  function checkContext(url, write) {
    const raw = url.searchParams.get('readContext');
    if (!raw && !write) return;
    let given;
    try { given = normalizeReadContext(JSON.parse(raw)); }
    catch { throw new RpWebError('invalid_request', 'A valid readContext is required.'); }
    const current = context();
    if (['serverInstanceId', 'cardId', 'chatId'].some(key => given[key] !== current[key])) throw new RpWebError('session_changed', 'Synthetic context changed; reconnect.');
    if (given.executionId != null) throw new RpWebError(write ? 'preview_read_only' : 'unsupported_capability', 'The core simulator does not implement candidate projections.');
  }
  function command(key, body, action) {
    const signature = JSON.stringify(body);
    const previous = receipts.get(key);
    if (previous) {
      if (previous.signature !== signature) throw new RpWebError('invalid_request', 'Operation identity was reused with different content.');
      return structuredClone(previous.result);
    }
    const result = action();
    receipts.set(key, { signature, result: structuredClone(result) });
    return result;
  }
  return {
    list: () => scenarios.map(({ id, title, features }) => ({ id, title, features })),
    reset,
    setFault(kind) {
      if (kind !== 'drop-after-input') throw new RpWebError('invalid_request', 'Unknown fault.');
      fault = kind;
    },
    execute(operation, url, body) {
      if (!operation || !mockCapabilities[service].includes(operation.id)) throw new RpWebError('unsupported_capability', 'This operation is not implemented by the synthetic service. Use a confirmed domain fixture or real test backend.');
      validateOperationRequest(operation, body);
      const write = operation.method !== 'GET';
      if (operation.id !== 'connection') checkContext(url, write);
      let data;
      switch (operation.id) {
        case 'connection': data = { apiVersion: API_VERSION, hostVersion: HOST_VERSION, serverInstanceId, mode: service, readContext: context(), capabilities: mockCapabilities[service], resources: { apiRoot: '/api/v1' }, authentication: { connection: 'synthetic-only' } }; break;
        case 'get.cards': data = { cards: getScenario('empty').design.cards, recent: [], active: null }; break;
        case 'get.card': data = card; break;
        case 'get.state': data = state; break;
        case 'post.opening': {
          if (state.sessionId) throw new RpWebError('invalid_state', 'A synthetic chat already exists.');
          if (body?.openingId !== 'arrival') throw new RpWebError('invalid_request', 'Unknown synthetic opening.');
          state = { ...state, sessionId: 'synthetic-chat', openingId: 'arrival', playerName: body.playerName || '旅人', messages: [{ sequence: 0, role: 'assistant', content: card.openings[0].content, revision: 1, turn: 0 }] };
          data = state; break;
        }
        case 'post.input': {
          data = command(`input:${body.operationId}`, body, () => {
            if (!state.sessionId || state.busy || state.blockingWorkflows?.length || state.lastTurnFailure) throw new RpWebError('invalid_state', 'Synthetic state does not allow input. Reset to ready.');
            const turn = state.currentTurn + 1;
            state.messages.push({ sequence: state.messages.length, role: 'user', content: body.content, revision: 1, turn });
            state.messages.push({ sequence: state.messages.length, role: 'assistant', content: '【离线合成响应】你停下来观察，发现了一条新的线索。', revision: 1, turn });
            state.currentTurn = turn;
            return state;
          });
          break;
        }
        case 'put.messages.sequence': {
          const sequence = Number(url.pathname.split('/').at(-1));
          data = command(`revision:${sequence}:${body.operationId}`, body, () => {
            const message = state.messages.find(item => item.sequence === sequence);
            if (!message) throw new RpWebError('not_found', 'Message not found.');
            if (state.busy) throw new RpWebError('invalid_state', 'Synthetic state is busy.');
            if (message.revision !== body.expectedRevision) throw new RpWebError('revision_conflict', 'Keep the local draft and read the new revision.', { details: { actualRevision: message.revision } });
            message.content = body.content; message.revision++;
            return state;
          });
          break;
        }
      }
      validateOperationResponse(operation, data);
      const drop = operation.id === 'post.input' && fault === 'drop-after-input';
      if (drop) fault = null;
      return { data: structuredClone(data), readContext: context(), drop };
    },
  };
}
