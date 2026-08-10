/**
 * Cambrian MCP & X402 Micropayment Unit Tests
 */

import { defaultMcpEngine } from '../src/core/mcp-server.js';
import { defaultX402Facilitator } from '../src/core/x402-payment.js';

async function runMcpTests() {
  console.log('Testing Cambrian AgentFi Monetized MCP & X402 Engine...');

  // 1. Challenge creation
  const challenge = defaultX402Facilitator.createChallenge('get_financial_intelligence');
  if (challenge.statusCode !== 402 || challenge.challenge.amount !== 0.03) {
    throw new Error('X402 HTTP 402 challenge generation failed');
  }

  // 2. Paid execution
  const res = defaultMcpEngine.executeToolCall({
    toolName: 'get_financial_intelligence',
    clientAddress: '0xTestAgent11111111111111111111111111111111',
  });

  if (!res.success || !res.log.result.marketSignal) {
    throw new Error('Monetized MCP tool execution failed');
  }

  console.log(`✅ Cambrian Monetized MCP Tool & X402 Payment Tested (${res.log.toolName})!`);
}

runMcpTests().catch(e => {
  console.error('❌ MCP Test Failed:', e);
  process.exit(1);
});
