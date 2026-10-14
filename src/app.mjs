import { createRpClient } from '/packages/rp-web-client/index.mjs';

const client = createRpClient({ baseUrl: location.origin });
const button = document.querySelector('#connect');
const status = document.querySelector('#status');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const connection = await client.connect();
    // Do not print configuration tokens, secrets or arbitrary backend payloads.
    status.textContent = JSON.stringify({ mode: connection.mode, apiVersion: connection.apiVersion, capabilities: connection.capabilities }, null, 2);
  } catch (error) {
    status.textContent = `${error.code || 'connection_failed'}: ${error.message}`;
  } finally { button.disabled = false; }
});
window.addEventListener('pagehide', () => client.dispose(), { once: true });
