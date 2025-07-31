#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CAMBRIAN_API_KEY = process.env.CAMBRIAN_API_KEY;
const CAMBRIAN_API_BASE_URL = process.env.CAMBRIAN_API_BASE_URL || 'https://opabinia.cambrian.org';

async function testCorrectEndpoints() {
  console.log('🧪 Testing Cambrian API with CORRECT endpoints...\n');

  // Test 1: Pool Details with correct path
  console.log('📊 Test 1: Pool Details (solanapooldetails) - CORRECT PATH');
  console.log('Endpoint: GET /api/v1/solana/pool');
  console.log('Parameters: programId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE');
  
  try {
    const poolDetailsUrl = `${CAMBRIAN_API_BASE_URL}/api/v1/solana/pool?programId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE`;
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
    console.log('Response preview:', JSON.stringify(response1.data, null, 2).substring(0, 300) + '...\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error data:', error.response?.data);
    console.log('');
  }

  // Test 2: Fee Ranges with required timeframeDays
  console.log('📊 Test 2: Fee Ranges WITH REQUIRED timeframeDays');
  console.log('Endpoint: GET /api/v1/solana/pools/fee_ranges');
  console.log('Parameters: poolId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE&timeframeDays=7');
  
  try {
    const feeRangesUrl = `${CAMBRIAN_API_BASE_URL}/api/v1/solana/pools/fee_ranges?poolId=Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE&timeframeDays=7`;
    console.log(`URL: ${feeRangesUrl}`);
    
    const response2 = await axios({
      method: 'GET',
      url: feeRangesUrl,
      headers: {
        'X-API-KEY': CAMBRIAN_API_KEY,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    console.log('✅ Success! Status:', response2.status);
    console.log('Response preview:', JSON.stringify(response2.data, null, 2).substring(0, 300) + '...\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error data:', error.response?.data);
    console.log('');
  }

  console.log('🏁 Both endpoints should work correctly now!\n');
}

// Run the tests
testCorrectEndpoints().catch(console.error);