async function checkHealth(service, statusEl) {
  statusEl.textContent = 'Checking...';
  statusEl.className = 'status';

  try {
    const res = await fetch(`/${service}/health`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    statusEl.textContent = `OK - ${JSON.stringify(data)}`;
    statusEl.className = 'status ok';
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.className = 'status error';
  }
}

document.querySelectorAll('.card').forEach((card) => {
  const service = card.getAttribute('data-service');
  const button = card.querySelector('button[data-action="check"]');
  const statusEl = card.querySelector('[data-status]');

  button.addEventListener('click', () => checkHealth(service, statusEl));
});

