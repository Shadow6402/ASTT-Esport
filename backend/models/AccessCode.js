const mongoose = require('mongoose');

const AccessCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Le code d\'accès est requis'],
    unique: true,
    trim: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: [true, 'La date d\'expiration est requise']
  },
  batchId: {
    type: String,
    required: [true, 'L\'identifiant du lot est requis']
  },
  importedAt: {
    type: Date,
    default: Date.now
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
AccessCodeSchema.index({ code: 1 });
AccessCodeSchema.index({ assignedTo: 1 });
AccessCodeSchema.index({ isUsed: 1 });
AccessCodeSchema.index({ expiresAt: 1 });
AccessCodeSchema.index({ batchId: 1 });

module.exports = mongoose.model('AccessCode', AccessCodeSchema);
