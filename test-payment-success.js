const axios = require('axios');

async function testPaymentSuccess() {
  try {
    // You'll need to get a real token from your browser's localStorage
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzQyYjM0ZjBkN2EyZjBmMGU5ZjQzY2EiLCJpYXQiOjE3MzQ5MjI4MDgsImV4cCI6MTczNDkyNjQwOH0.test-token'; // Replace with actual token
    const sessionId = 'cs_test_a1PmNO5EfMEqtFTuqoQXoBCIoXKln064u9PsYL4HVmnERUMzwPxD41FpTL';
    
    console.log('Testing payment success endpoint...');
    console.log('Session ID:', sessionId);
    
    const res = await axios.get(
      `http://localhost:5000/api/payment/success?session_id=${sessionId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Response status:', res.status);
    console.log('Response data:', JSON.stringify(res.data, null, 2));
    
  } catch (error) {
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
  }
}

testPaymentSuccess();
