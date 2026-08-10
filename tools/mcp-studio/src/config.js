/**
 * Cambrian AgentFi & Monetized MCP Configuration
 */

export const CAMBRIAN_CONFIG = {
  protocol: {
    name: 'Cambrian Monetized MCP Server',
    paymentProtocol: 'X402 (HTTP 402 Payment Required)',
    settlementNetwork: 'Base Mainnet',
    acceptedToken: 'USDC',
    costPerToolCallUsdc: 0.03, // $0.03 USDC per call
  },
  mcpTools: [
    {
      name: 'get_financial_intelligence',
      description: 'Fetch real-time on-chain wallet movements, DEX liquidity depths, and institutional flows.',
      cost: '0.03 USDC',
    },
    {
      name: 'get_lending_yields',
      description: 'Query aggregated APY rates across Aave, Morpho, Fluid, and Compound on Base/Ethereum.',
      cost: '0.03 USDC',
    },
    {
      name: 'get_social_sentiment',
      description: 'Aggregate AI-scored sentiment metrics from X/Twitter, Farcaster, and news feeds.',
      cost: '0.03 USDC',
    },
  ],
};
