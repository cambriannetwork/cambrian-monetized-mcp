/**
 * Cambrian MCP Studio Client Logic
 */

let activeAgentAddr = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('agent-address').value = activeAgentAddr;
  initTabs();
  loadConfig();
  loadLogs();
  initFormListeners();
});

function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `tab-${tab.dataset.tab}`));
    });
  });
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();

    const selectTool = document.getElementById('select-mcp-tool');
    const grid = document.getElementById('tools-container');

    selectTool.innerHTML = '';
    grid.innerHTML = '';

    data.tools.forEach(t => {
      // Option
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = `${t.name} (${t.cost})`;
      selectTool.appendChild(opt);

      // Card
      const card = document.createElement('div');
      card.className = 'tool-card';
      card.innerHTML = `
        <div class="tool-title">${t.name}</div>
        <div class="tool-cost">Cost: ${t.cost}</div>
        <div class="text-muted" style="font-size: 0.82rem;">${t.description}</div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadLogs() {
  try {
    const res = await fetch('/api/logs');
    const data = await res.json();
    const container = document.getElementById('calls-history-container');

    if (!data.toolCalls || data.toolCalls.length === 0) return;
    container.innerHTML = '';

    data.toolCalls.forEach(call => {
      const row = document.createElement('div');
      row.className = 'ledger-row';
      row.innerHTML = `
        <div>
          <div style="font-weight: 700; color: #fff;">${call.toolName}</div>
          <div class="mono text-muted" style="font-size: 0.72rem;">TX: ${call.paymentTx.slice(0, 16)}...</div>
        </div>
        <div style="text-align: right;">
          <span class="cost-tag" style="color: #34d399;">Paid $0.03 USDC</span>
          <div class="text-muted" style="font-size: 0.75rem;">${new Date(call.timestamp).toLocaleTimeString()}</div>
        </div>
      `;
      container.appendChild(row);
    });
  } catch (e) {
    console.warn(e);
  }
}

function initFormListeners() {
  document.getElementById('mcp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-call-mcp');
    const resultBox = document.getElementById('mcp-result-box');

    const toolName = document.getElementById('select-mcp-tool').value;
    const clientAddress = document.getElementById('agent-address').value;

    btn.disabled = true;
    btn.textContent = '⏳ Verifying Base X402 Micropayment...';

    try {
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, clientAddress }),
      });
      const data = await res.json();

      if (data.success) {
        resultBox.innerHTML = `
          <div class="card" style="border-color: #a855f7; background: rgba(168, 85, 247, 0.08);">
            <strong style="color: #c084fc;">🤖 X402 Micropayment Verified & Data Unlocked!</strong>
            <pre class="mono mt-2" style="font-size: 0.78rem; color: #34d399; white-space: pre-wrap; background: #07050d; padding: 0.75rem; border-radius: 6px;">${JSON.stringify(data.log.result, null, 2)}</pre>
            <div class="mono text-muted mt-1" style="font-size: 0.75rem;">Payment TX: ${data.payment.txHash}</div>
          </div>
        `;
        loadLogs();
      }
    } catch (err) {
      resultBox.innerHTML = `<div class="badge red">Execution error: ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = '💳 Settle X402 & Fetch Data';
    }
  });
}
