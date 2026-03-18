// payment-service/src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true
  },
  orderId: {
    type: String,
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionDetails: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate payment ID before saving
// Use promise-style pre hook without next() to avoid mixing callback and async styles
paymentSchema.pre('save', async function() {
  if (!this.paymentId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.paymentId = `PAY-${timestamp}-${random}`;
  }
  return;
});

module.exports = mongoose.model('Payment', paymentSchema);