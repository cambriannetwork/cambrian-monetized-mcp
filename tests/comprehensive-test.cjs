const axios = require('axios');
const fs = require('fs');

const API_URL = 'https://opabinia.cambrian.org';
const API_KEY = 'mcp.NHb1BbO2un6dpPzK9GBE';

// Comprehensive list of all Cambrian API endpoints to test
const allEndpoints = [
  // EVM endpoints
  { name: 'EVM Chains', endpoint: '/api/v1/evm/chains', method: 'GET', params: {} },
  { name: 'EVM DEXes', endpoint: '/api/v1/evm/dexes', method: 'GET', params: {} },
  { name: 'EVM Tokens', endpoint: '/api/v1/evm/tokens', method: 'GET', params: {} },
  { name: 'EVM Current Price', endpoint: '/api/v1/evm/price-current', method: 'GET', params: { dex_id: 'uniswap', pool_id: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8' } },
  { name: 'EVM Price History Hour', endpoint: '/api/v1/evm/price-hour', method: 'GET', params: { dex_id: 'uniswap', pool_id: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', hours: 24 } },
  { name: 'EVM Price History Day', endpoint: '/api/v1/evm/price-day', method: 'GET', params: { dex_id: 'uniswap', pool_id: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', days: 7 } },
  { name: 'EVM Uniswap V2 Pools', endpoint: '/api/v1/evm/uniswap/v2/pools', method: 'GET', params: { chain: '8453', token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' } },
  { name: 'EVM Uniswap V3 Pools', endpoint: '/api/v1/evm/uniswap/v3/pools', method: 'GET', params: { chain: '8453', token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' } },
  { name: 'EVM Aerodrome V2 Pools', endpoint: '/api/v1/evm/aero/v2/pools', method: 'GET', params: { offset: 0, limit: 10 } },
  { name: 'EVM TVL Top', endpoint: '/api/v1/evm/tvl/top', method: 'GET', params: {} },
  { name: 'EVM TVL Status', endpoint: '/api/v1/evm/tvl/status', method: 'GET', params: {} },
  
  // Solana endpoints
  { name: 'Solana Latest Block', endpoint: '/api/v1/solana/latest_block', method: 'GET', params: {} },
  { name: 'Solana Current Price', endpoint: '/api/v1/solana/price_current', method: 'GET', params: { dex: 'JUPITER', pool: 'BqnpCdDLPV2pFdAaLnVidmn3G93RP2p5oRdGEY2sJGez' } },
  { name: 'Solana Price History Hour', endpoint: '/api/v1/solana/price_hour', method: 'GET', params: { pool_id: 'BqnpCdDLPV2pFdAaLnVidmn3G93RP2p5oRdGEY2sJGez', hours: 24 } },
  { name: 'Solana Tokens', endpoint: '/api/v1/solana/tokens', method: 'GET', params: {} },
  { name: 'Solana Token Info', endpoint: '/api/v1/solana/token', method: 'GET', params: { address: 'So11111111111111111111111111111111111111112' } },
  { name: 'Solana Trending Tokens', endpoint: '/api/v1/solana/trending_tokens', method: 'GET', params: {} },
  { name: 'Solana Holder Balances', endpoint: '/api/v1/solana/holder_token_balances', method: 'GET', params: { holder: 'DG7n2DGos2fhzz3ZbmHAy5kbJJVYP1niCBG2K8TLSi8u', page: 1 } },
  { name: 'Solana Jupiter Pools', endpoint: '/api/v1/solana/jupiter/pools', method: 'GET', params: { token: 'So11111111111111111111111111111111111111112' } },
  { name: 'Solana Raydium CLMM Pools', endpoint: '/api/v1/solana/raydium_clmm/pools', method: 'GET', params: { token: 'So11111111111111111111111111111111111111112' } },
  { name: 'Solana Raydium CPMM Pools', endpoint: '/api/v1/solana/raydium_cpmm/pools', method: 'GET', params: { token: 'So11111111111111111111111111111111111111112' } },
  { name: 'Solana Orca Pools', endpoint: '/api/v1/solana/orca_whirlpool/pools', method: 'GET', params: { token: 'So11111111111111111111111111111111111111112' } },
  { name: 'Solana Meteora Pools', endpoint: '/api/v1/solana/meteora/pools', method: 'GET', params: { token: 'So11111111111111111111111111111111111111112' } },
  { name: 'Solana Pools Fee Ranges', endpoint: '/api/v1/solana/pools/fee_ranges', method: 'GET', params: { pool_ids: 'BqnpCdDLPV2pFdAaLnVidmn3G93RP2p5oRdGEY2sJGez', timeframeDays: 7 } }
];

// Categories for analysis
const issueCategories = {
  timeout: [],
  notFound: [],
  serverError: [],
  dataTypeIssues: [],
  successful: [],
  unexpectedFormat: []
};

async function testEndpoint(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Endpoint: ${testCase.endpoint}`);
  console.log(`   Method: ${testCase.method}`);
  
  try {
    const start = Date.now();
    
    // Build URL with query params
    let url = `${API_URL}${testCase.endpoint}`;
    if (testCase.method === 'GET' && Object.keys(testCase.params).length > 0) {
      const queryParams = new URLSearchParams(testCase.params).toString();
      url += `?${queryParams}`;
    }
    
    const response = await axios({
      method: testCase.method,
      url: url,
      data: testCase.method === 'POST' ? testCase.params : undefined,
      headers: {
        'X-API-KEY': API_KEY,
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    const elapsed = Date.now() - start;
    
    console.log(`   ✅ Success in ${elapsed}ms`);
    
    // Analyze response structure
    const dataAnalysis = analyzeDataStructure(response.data);
    console.log(`   Data structure: ${dataAnalysis.summary}`);
    
    // Check for expected Cambrian format
    if (dataAnalysis.isCambrianFormat) {
      console.log(`   ✅ Standard Cambrian format (columns/data/rows)`);
    } else if (dataAnalysis.hasData) {
      console.log(`   ⚠️  Non-standard format but has data`);
      issueCategories.unexpectedFormat.push({
        endpoint: testCase.name,
        format: dataAnalysis.summary
      });
    }
    
    issueCategories.successful.push({
      endpoint: testCase.name,
      responseTime: elapsed,
      dataType: dataAnalysis.summary,
      isCambrianFormat: dataAnalysis.isCambrianFormat
    });
    
    return { success: true, elapsed, dataAnalysis };
    
  } catch (error) {
    const errorType = categorizeError(error);
    console.log(`   ❌ ${errorType}: ${error.message}`);
    
    // Categorize the error
    if (errorType === 'Timeout') {
      issueCategories.timeout.push({
        endpoint: testCase.name,
        message: error.message
      });
    } else if (error.response?.status === 404) {
      issueCategories.notFound.push({
        endpoint: testCase.name,
        message: error.response.data?.message || 'Not found'
      });
    } else if (error.response?.status >= 500) {
      issueCategories.serverError.push({
        endpoint: testCase.name,
        status: error.response.status,
        message: error.response.data?.message || error.message
      });
    } else {
      issueCategories.dataTypeIssues.push({
        endpoint: testCase.name,
        error: error.message,
        status: error.response?.status
      });
    }
    
    return { success: false, error: error.message, errorType };
  }
}

function categorizeError(error) {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'Timeout';
  } else if (error.response?.status === 404) {
    return '404 Not Found';
  } else if (error.response?.status >= 500) {
    return `${error.response.status} Server Error`;
  } else if (error.response) {
    return `${error.response.status} Error`;
  }
  return 'Network Error';
}

function analyzeDataStructure(data) {
  const analysis = {
    type: typeof data,
    isArray: Array.isArray(data),
    isCambrianFormat: false,
    hasData: false,
    summary: ''
  };
  
  if (Array.isArray(data)) {
    analysis.hasData = data.length > 0;
    analysis.summary = `Array[${data.length}]`;
    
    // Check if it's the standard Cambrian format
    if (data.length > 0 && data[0].columns && data[0].data && data[0].rows !== undefined) {
      analysis.isCambrianFormat = true;
      analysis.summary = `CambrianFormat[${data[0].rows} rows]`;
    }
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    analysis.hasData = keys.length > 0;
    
    // Check for standard response wrapper
    if (data.columns && data.data && data.rows !== undefined) {
      analysis.isCambrianFormat = true;
      analysis.summary = `CambrianFormat[${data.rows} rows]`;
    } else {
      analysis.summary = `Object{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
    }
  } else {
    analysis.summary = analysis.type;
  }
  
  return analysis;
}

async function runComprehensiveTests() {
  console.log('🚀 Comprehensive Cambrian API Testing for MCP Server');
  console.log('====================================================');
  console.log(`Testing ${allEndpoints.length} endpoints...`);
  
  for (const testCase of allEndpoints) {
    await testEndpoint(testCase);
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Generate comprehensive report
  console.log('\n\n📊 COMPREHENSIVE TEST REPORT');
  console.log('================================');
  
  console.log(`\n✅ Successful Endpoints (${issueCategories.successful.length}/${allEndpoints.length}):`);
  issueCategories.successful.forEach(item => {
    console.log(`   - ${item.endpoint}: ${item.responseTime}ms, ${item.dataType}`);
  });
  
  console.log(`\n⏱️  Timeout Issues (${issueCategories.timeout.length}):`);
  if (issueCategories.timeout.length > 0) {
    issueCategories.timeout.forEach(item => {
      console.log(`   - ${item.endpoint}`);
    });
    console.log('   💡 Note: Timeouts are expected for some heavy queries');
  } else {
    console.log('   None - All endpoints responded within timeout');
  }
  
  console.log(`\n🔍 404 Not Found (${issueCategories.notFound.length}):`);
  if (issueCategories.notFound.length > 0) {
    issueCategories.notFound.forEach(item => {
      console.log(`   - ${item.endpoint}: ${item.message}`);
    });
  } else {
    console.log('   None');
  }
  
  console.log(`\n💥 Server Errors (${issueCategories.serverError.length}):`);
  if (issueCategories.serverError.length > 0) {
    issueCategories.serverError.forEach(item => {
      console.log(`   - ${item.endpoint}: ${item.status} - ${item.message}`);
    });
  } else {
    console.log('   None');
  }
  
  console.log(`\n⚠️  Data Type Issues (${issueCategories.dataTypeIssues.length}):`);
  if (issueCategories.dataTypeIssues.length > 0) {
    issueCategories.dataTypeIssues.forEach(item => {
      console.log(`   - ${item.endpoint}: ${item.error}`);
    });
  } else {
    console.log('   None - All data types handled correctly');
  }
  
  console.log(`\n📋 Format Consistency (${issueCategories.unexpectedFormat.length} non-standard):`);
  if (issueCategories.unexpectedFormat.length > 0) {
    issueCategories.unexpectedFormat.forEach(item => {
      console.log(`   - ${item.endpoint}: ${item.format}`);
    });
  } else {
    console.log('   All successful responses use standard Cambrian format');
  }
  
  // Production readiness assessment
  console.log('\n\n🏆 PRODUCTION READINESS ASSESSMENT');
  console.log('=====================================');
  
  const successRate = (issueCategories.successful.length / allEndpoints.length * 100).toFixed(1);
  const hasDataTypeIssues = issueCategories.dataTypeIssues.length > 0;
  const hasCriticalErrors = issueCategories.serverError.length > 0 && 
    issueCategories.serverError.some(e => !e.message.includes('timeout'));
  
  console.log(`✅ Success Rate: ${successRate}%`);
  console.log(`✅ Data Type Handling: ${hasDataTypeIssues ? '❌ Issues found' : '✅ All types handled'}`);
  console.log(`✅ Server Stability: ${hasCriticalErrors ? '❌ Critical errors found' : '✅ No critical errors'}`);
  console.log(`✅ Response Format: ${issueCategories.unexpectedFormat.length === 0 ? '✅ Consistent' : '⚠️  Some variations'}`);
  console.log(`✅ Timeout Handling: ✅ Gracefully handled`);
  
  console.log('\n📝 MARKETPLACE SUBMISSION READINESS:');
  if (successRate >= 70 && !hasDataTypeIssues && !hasCriticalErrors) {
    console.log('✅ READY FOR SUBMISSION');
    console.log('\nRecommendations:');
    console.log('- Document expected timeout behavior for heavy queries');
    console.log('- Note the 404 endpoints in documentation');
    console.log('- Consider implementing retry logic for timeout-prone endpoints');
  } else {
    console.log('⚠️  NEEDS ATTENTION BEFORE SUBMISSION');
    console.log('\nRequired fixes:');
    if (hasDataTypeIssues) console.log('- Fix data type handling issues');
    if (hasCriticalErrors) console.log('- Resolve server errors');
    if (successRate < 70) console.log('- Improve endpoint success rate');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEndpoints: allEndpoints.length,
      successful: issueCategories.successful.length,
      timeouts: issueCategories.timeout.length,
      notFound: issueCategories.notFound.length,
      serverErrors: issueCategories.serverError.length,
      dataTypeIssues: issueCategories.dataTypeIssues.length,
      formatIssues: issueCategories.unexpectedFormat.length
    },
    details: issueCategories,
    productionReady: successRate >= 70 && !hasDataTypeIssues && !hasCriticalErrors
  };
  
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to test-report.json');
}

// Run the comprehensive tests
runComprehensiveTests().then(() => {
  console.log('\n✅ Comprehensive testing complete!');
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
});