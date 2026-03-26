import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Create a test admin token (you'll need to use a real admin token from your frontend)
const testAdminToken = 'YOUR_REAL_ADMIN_TOKEN_HERE'; // Replace with actual admin token

const testWithRealToken = async () => {
    try {
        console.log('=== Testing with Real Admin Token ===');
        console.log('Note: Replace YOUR_REAL_ADMIN_TOKEN_HERE with actual admin token from localStorage');
        
        // Test the billing overview endpoint
        const response = await axios.get('http://localhost:5000/api/billing/overview', {
            headers: {
                'Authorization': `Bearer ${testAdminToken}`,
                'Content-Type': 'application/json'
            }
        }).catch(error => {
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Data:', error.response.data);
                return error.response;
            }
            throw error;
        });

        if (response.data) {
            console.log('\n✅ Success! API Response:');
            console.log('Stats:', response.data.stats);
            console.log('Residents count:', response.data.residents?.length || 0);
            
            if (response.data.residents && response.data.residents.length > 0) {
                console.log('\n📋 Sample Resident:');
                const sampleResident = response.data.residents[0];
                console.log('Name:', sampleResident.name);
                console.log('Email:', sampleResident.email);
                console.log('Total Amount:', sampleResident.totalAmount);
                console.log('Paid Amount:', sampleResident.totalPaid);
                console.log('Due Amount:', sampleResident.totalDue);
                console.log('Status:', sampleResident.totalDue === 0 ? 'PAID' : 'UNPAID');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Instructions
console.log('📋 How to get real admin token:');
console.log('1. Login as admin in your frontend');
console.log('2. Open browser dev tools (F12)');
console.log('3. Go to Application/Storage');
console.log('4. Copy the token value');
console.log('5. Replace YOUR_REAL_ADMIN_TOKEN_HERE with the actual token');
console.log('6. Run this script again');
console.log('\n');

testWithRealToken();
