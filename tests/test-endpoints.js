const axios = require('axios');

const MCP_URL = 'https://mcp.rickycambrian.org/monetized';
const API_URL = 'https://opabinia.cambrian.org';

// Test various endpoint types
const testCases = [
  // Simple GET endpoints without parameters
  {
    name: 'EVM Chains (No params)',
    endpoint: '/api/v1/evm/chains',
    method: 'GET',
    params: {}
  },
  {
    name: 'Solana Latest Block',
    endpoint: '/api/v1/solana/latest_block',
    method: 'GET',
    params: {}
  },
  
  // Endpoints with required parameters
  {
    name: 'EVM Uniswap V3 Pools (with params)',
    endpoint: '/api/v1/evm/uniswap/v3/pools',
    method: 'GET',
    params: {
      chain: '8453', // Base chain ID
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
    }
  },
  {
    name: 'Solana Token Info',
    endpoint: '/api/v1/solana/token',
    method: 'GET',
    params: {
      address: 'So11111111111111111111111111111111111111112' // SOL
    }
  },
  
  // Endpoints with optional parameters
  {
    name: 'EVM Aerodrome Pools (with pagination)',
    endpoint: '/api/v1/evm/aero/v2/pools',
    method: 'GET',
    params: {
      offset: 0,
      limit: 10
    }
  },
  
  // POST endpoints
  {
    name: 'Solana Trending Tokens',
    endpoint: '/api/v1/solana/trending_tokens',
    method: 'GET',
    params: {}
  },
  
  // Complex parameter types
  {
    name: 'EVM Price History',
    endpoint: '/api/v1/evm/price-hour',
    method: 'GET',
    params: {
      dex_id: 'uniswap',
      pool_id: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
      hours: 24
    }
  },
  {
    name: 'Solana Holder Balances',
    endpoint: '/api/v1/solana/holder_token_balances',
    method: 'GET',
    params: {
      holder: 'DG7n2DGos2fhzz3ZbmHAy5kbJJVYP1niCBG2K8TLSi8u',
      page: 1
    }
  }
];

async function testEndpoint(testCase) {
  console.log(`\\n🧪 Testing: ${testCase.name}`);
  console.log(`   Endpoint: ${testCase.endpoint}`);
  console.log(`   Method: ${testCase.method}`);
  console.log(`   Params:`, testCase.params);
  
  try {
    const start = Date.now();
    
    // Build URL with query params for GET
    let url = `${API_URL}${testCase.endpoint}`;
    if (testCase.method === 'GET' && Object.keys(testCase.params).length > 0) {
      const queryParams = new URLSearchParams(testCase.params).toString();
      url += `?${queryParams}`;
    }
    
    const response = await axios({
      method: testCase.method,
      url: url,
      data: testCase.method === 'POST' ? testCase.params : undefined,
      timeout: 30000
    });
    
    const elapsed = Date.now() - start;
    
    console.log(`   ✅ Success in ${elapsed}ms`);
    console.log(`   Response type: ${typeof response.data}`);
    
    // Analyze response structure
    if (Array.isArray(response.data)) {
      console.log(`   Array length: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log(`   First item keys: ${Object.keys(response.data[0]).join(', ')}`);
      }
    } else if (typeof response.data === 'object') {
      const keys = Object.keys(response.data);
      console.log(`   Object keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
    }
    
    return { success: true, elapsed, dataType: typeof response.data };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message || error.response.data}`);
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Cambrian MCP Server Endpoint Testing');
  console.log('=====================================');
  
  const results = {
    total: testCases.length,
    successful: 0,
    failed: 0,
    slowEndpoints: [],
    dataTypes: {}
  };
  
  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    if (result.success) {
      results.successful++;
      if (result.elapsed > 5000) {
        results.slowEndpoints.push({ name: testCase.name, time: result.elapsed });
      }
      results.dataTypes[result.dataType] = (results.dataTypes[result.dataType] || 0) + 1;
    } else {
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\\n📊 Test Summary');
  console.log('================');
  console.log(`Total tests: ${results.total}`);
  console.log(`Successful: ${results.successful} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`\\nData types returned:`, results.dataTypes);
  
  if (results.slowEndpoints.length > 0) {
    console.log(`\\n⚠️  Slow endpoints (>5s):`);
    results.slowEndpoints.forEach(ep => {
      console.log(`   - ${ep.name}: ${ep.time}ms`);
    });
  }
  
  return results;
}

// Run the tests
runTests().then(results => {
  console.log('\\n✅ Testing complete!');
}).catch(error => {
  console.error('\\n❌ Test suite failed:', error);
});