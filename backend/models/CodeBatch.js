const mongoose = require('mongoose');

const CodeBatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du lot est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur qui a importé le lot est requis']
  },
  importedAt: {
    type: Date,
    default: Date.now
  },
  totalCodes: {
    type: Number,
    default: 0
  },
  assignedCodes: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: [true, 'La date d\'expiration du lot est requise']
  },
  sourceFile: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
CodeBatchSchema.index({ importedAt: 1 });
CodeBatchSchema.index({ expiryDate: 1 });
CodeBatchSchema.index({ isActive: 1 });

module.exports = mongoose.model('CodeBatch', CodeBatchSchema);
