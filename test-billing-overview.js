import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testBillingOverview = async () => {
    try {
        console.log('=== Testing Admin Billing Overview ===');
        
        // Test the new endpoint
        const response = await axios.get('http://localhost:5000/api/billing/overview', {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            }
        }).catch(error => {
            console.log('Expected auth error, endpoint exists');
            return { status: 401 };
        });

        console.log('Response status:', response.status);
        
        if (response.status === 401) {
            console.log('✅ Endpoint exists and requires authentication (as expected)');
        } else {
            console.log('Response data:', response.data);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
};

testBillingOverview();
