#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CAMBRIAN_API_KEY = process.env.CAMBRIAN_API_KEY;
const CAMBRIAN_API_BASE_URL = process.env.CAMBRIAN_API_BASE_URL || 'https://opabinia.cambrian.org';

async function testCambrianEndpoints() {
  console.log('🧪 Testing Cambrian API endpoints directly...\n');

  // Test 1: Pool Details endpoint
  console.log('📊 Test 1: Pool Details (solanapooldetails)');
  console.log('Endpoint: GET /api/v1/solana/pools/details');
  console.log('Parameters: programId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE');
  
  try {
    const poolDetailsUrl = `${CAMBRIAN_API_BASE_URL}/api/v1/solana/pools/details?programId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE`;
    console.log(`URL: ${poolDetailsUrl}`);
    
    const response1 = await axios({
      method: 'GET',
      url: poolDetailsUrl,
      headers: {
        'X-API-KEY': CAMBRIAN_API_KEY,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    console.log('✅ Success! Status:', response1.status);
    console.log('Response data sample:', JSON.stringify(response1.data, null, 2).substring(0, 200) + '...\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error data:', error.response?.data);
    console.log('');
  }

  // Test 2: Fee Ranges endpoint (without timeframeDays)
  console.log('📊 Test 2: Fee Ranges WITHOUT timeframeDays parameter');
  console.log('Endpoint: GET /api/v1/solana/pools/fee_ranges');
  console.log('Parameters: poolId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE');
  
  try {
    const feeRangesUrl1 = `${CAMBRIAN_API_BASE_URL}/api/v1/solana/pools/fee_ranges?poolId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE`;
    console.log(`URL: ${feeRangesUrl1}`);
    
    const response2 = await axios({
      method: 'GET',
      url: feeRangesUrl1,
      headers: {
        'X-API-KEY': CAMBRIAN_API_KEY,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    console.log('✅ Success! Status:', response2.status);
    console.log('Response data sample:', JSON.stringify(response2.data, null, 2).substring(0, 200) + '...\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error data:', error.response?.data);
    console.log('');
  }

  // Test 3: Fee Ranges endpoint (with timeframeDays as string)
  console.log('📊 Test 3: Fee Ranges WITH timeframeDays=7 (as string)');
  console.log('Endpoint: GET /api/v1/solana/pools/fee_ranges');
  console.log('Parameters: poolId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE&timeframeDays=7');
  
  try {
    const feeRangesUrl2 = `${CAMBRIAN_API_BASE_URL}/api/v1/solana/pools/fee_ranges?poolId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE&timeframeDays=7`;
    console.log(`URL: ${feeRangesUrl2}`);
    
    const response3 = await axios({
      method: 'GET',
      url: feeRangesUrl2,
      headers: {
        'X-API-KEY': CAMBRIAN_API_KEY,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    console.log('✅ Success! Status:', response3.status);
    console.log('Response data sample:', JSON.stringify(response3.data, null, 2).substring(0, 200) + '...\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error data:', error.response?.data);
    console.log('');
  }

  // Test 4: Check what endpoints exist for this operation ID
  console.log('📊 Test 4: Checking OpenAPI schema for solanapoolsfeeranges');
  
  try {
    const schemaResponse = await axios.get(`${CAMBRIAN_API_BASE_URL}/openapi.json`);
    const paths = schemaResponse.data.paths;
    
    // Find all endpoints related to fee ranges
    const feeRangeEndpoints = Object.entries(paths).filter(([path, methods]) => {
      return Object.values(methods).some(op => 
        op.operationId === 'solanapoolsfeeranges' || 
        path.includes('fee_ranges')
      );
    });
    
    console.log('Found endpoints related to fee ranges:');
    feeRangeEndpoints.forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        if (operation.operationId) {
          console.log(`- ${method.toUpperCase()} ${path} (operationId: ${operation.operationId})`);
          if (operation.parameters) {
            console.log('  Parameters:', operation.parameters.map(p => `${p.name} (${p.required ? 'required' : 'optional'})`).join(', '));
          }
        }
      });
    });
    console.log('');
  } catch (error) {
    console.log('❌ Failed to fetch OpenAPI schema');
    console.log('Error:', error.message);
    console.log('');
  }

  console.log('🏁 Test complete!\n');
}

// Run the tests
testCambrianEndpoints().catch(console.error);