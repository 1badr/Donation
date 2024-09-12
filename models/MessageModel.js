const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: String,
    ref: 'User', 
  },
  receiver_id: {
    type: String,
    ref: 'User', 
  },
  content: {
    type: String,
  },
  sent_at: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;