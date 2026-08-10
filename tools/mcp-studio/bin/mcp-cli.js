#!/usr/bin/env node

/**
 * Cambrian Monetized MCP CLI
 */

import { CAMBRIAN_CONFIG } from '../src/config.js';
import { defaultMcpEngine } from '../src/core/mcp-server.js';
import { defaultX402Facilitator } from '../src/core/x402-payment.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command.toLowerCase()) {
    case 'tools': {
      console.log('\n🤖 Available Cambrian Monetized MCP Tools:');
      CAMBRIAN_CONFIG.mcpTools.forEach(t => {
        console.log(`  • [${t.name}] Cost: ${t.cost}`);
        console.log(`    Description: ${t.description}\n`);
      });
      break;
    }

    case 'call': {
      const toolName = args[1] || 'get_financial_intelligence';
      console.log(`\n💳 Requesting X402 Micropayment Challenge ($0.03 USDC)...`);
      const challenge = defaultX402Facilitator.createChallenge(toolName);
      console.log(`  Status Code: ${challenge.statusCode} ${challenge.error}`);
      console.log(`  Message:     ${challenge.message}`);

      console.log(`\n⚡ Simulating X402 Base USDC Micropayment Settlement...`);
      const res = defaultMcpEngine.executeToolCall({ toolName });
      console.log(`  Payment TX:  ${res.payment.txHash}`);
      console.log(`  Result Data: ${JSON.stringify(res.log.result, null, 2)}\n`);
      break;
    }

    case 'studio': {
      console.log('\n🌐 Launching Cambrian MCP Studio on :3418...');
      await import('../src/server/app.js');
      break;
    }

    default: {
      console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               🤖 CAMBRIAN AGENTFI MCP CLI                        ║
║        Monetized Model Context Protocol & X402 Payments          ║
╚══════════════════════════════════════════════════════════════════╝

Commands:
  cambrian-mcp-cli tools                 List available monetized MCP tools
  cambrian-mcp-cli call [toolName]       Execute X402 paid financial query
  cambrian-mcp-cli studio                Launch Interactive Web Studio on :3418
      `);
      break;
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
