/**
 * Cambrian Monetized MCP Web Studio Server
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CAMBRIAN_CONFIG } from '../config.js';
import { defaultMcpEngine } from '../core/mcp-server.js';
import { defaultX402Facilitator } from '../core/x402-payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.join(__dirname, '../../web');

const app = express();
const PORT = process.env.PORT || 3418;

app.use(cors());
app.use(express.json());
app.use(express.static(WEB_ROOT));

// 1. Get Protocol & Tools Config
app.get('/api/config', (req, res) => {
  res.json({
    protocol: CAMBRIAN_CONFIG.protocol,
    tools: CAMBRIAN_CONFIG.mcpTools,
  });
});

// 2. Request X402 Payment Challenge
app.post('/api/x402/challenge', (req, res) => {
  const { toolName } = req.body;
  const challenge = defaultX402Facilitator.createChallenge(toolName || 'get_financial_intelligence');
  res.status(402).json(challenge);
});

// 3. Execute Paid MCP Tool
app.post('/api/mcp/execute', (req, res) => {
  try {
    const result = defaultMcpEngine.executeToolCall(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Get Payment & Tool Logs
app.get('/api/logs', (req, res) => {
  res.json({
    toolCalls: defaultMcpEngine.getToolCallLogs(),
    payments: defaultX402Facilitator.getPaymentHistory(),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🤖 Cambrian AgentFi Monetized MCP Studio Running!`);
    console.log(`🌐 Web Dashboard: http://localhost:${PORT}`);
    console.log(`💳 Protocol: X402 Micropayments ($0.03 USDC on Base)`);
    console.log(`======================================================\n`);
  });
}

export default app;
