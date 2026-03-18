// payment-service/src/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order_confirmation', 'payment_confirmation', 'shipping_update', 'promotional'],
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push'],
    default: 'email'
  },
  recipient: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  content: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);