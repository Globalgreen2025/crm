const mongoose = require('mongoose');

const ticketStatus = ['open', 'in_progress', 'resolved', 'closed'];

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat',
    required: true 
  },
  commercial: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Commercial',
    required: false 
  },
  status: { 
    type: String, 
    enum: ticketStatus, 
    default: 'open' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  comments: [{
    text: String,
    postedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'comments.userType' 
    },
    userType: {
      type: String,
      enum: ['Admin', 'Commercial']
    },
    createdAt: { type: Date, default: Date.now }
  }],
  closedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin' 
  },
  createdBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdBy.userType'
    },
    userType: {
      type: String,
      enum: ['Admin', 'Commercial']
    },
    name: String
  },
  
  closedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);