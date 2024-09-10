const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: String,
    ref: 'User', 
    required: true
  },
  receiver_id: {
    type: String,
    ref: 'User', 
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sent_at: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;