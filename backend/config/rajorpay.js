require('dotenv').config();

// Mock implementation when using dummy keys
const isDummyKeys = process.env.RAZORPAY_KEY === 'rzp_test_dummy';

// If using dummy keys, create a mock Razorpay instance
// otherwise create a real Razorpay instance
exports.instance = {
  orders: {
    create: async (options) => {
      // Mock response for testing without real Razorpay
      return {
        id: "order_" + Math.random().toString(36).substring(2, 15),
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        created_at: new Date().getTime()
      };
    }
  }
};