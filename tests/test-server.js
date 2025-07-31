import http from 'http';
import { promises as fs } from 'fs';

console.log('Testing server readiness...');

// Test if port is available
const testServer = http.createServer();
testServer.listen(50133, async () => {
  console.log('✓ Port 50133 is available');
  testServer.close();
  
  // Test if build exists
  try {
    await fs.access('./dist/index.js');
    console.log('✓ Server build exists');
  } catch (error) {
    console.log('✗ Error: Server build not found');
    process.exit(1);
  }
  
  console.log('\nAll tests passed! Ready to deploy.');
});

testServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('✗ Port 50133 is already in use!');
    console.log('Please stop the existing service or choose a different port.');
  } else {
    console.log('✗ Error:', err.message);
  }
  process.exit(1);
});