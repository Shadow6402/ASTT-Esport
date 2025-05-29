const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  startDate: {
    type: Date,
    required: [true, 'La date de début est requise'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est requise']
  },
  membershipType: {
    type: String,
    enum: ['Mensuel', 'Trimestriel', 'Semestriel', 'Annuel'],
    required: [true, 'Le type d\'adhésion est requis']
  },
  paymentStatus: {
    type: String,
    enum: ['Payé', 'En attente', 'Échoué'],
    default: 'En attente'
  },
  paymentMethod: {
    type: String,
    enum: ['Carte bancaire', 'Virement', 'Espèces', 'Chèque'],
    default: 'Carte bancaire'
  },
  paymentDate: {
    type: Date
  },
  paymentAmount: {
    type: Number,
    required: [true, 'Le montant du paiement est requis']
  },
  transactionId: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: false
  },
  renewalReminded: {
    type: Boolean,
    default: false
  },
  renewalRemindedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  accessCodesCount: {
    type: Number,
    default: 0
  },
  accessCodes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessCode'
  }]
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
MembershipSchema.index({ user: 1 });
MembershipSchema.index({ endDate: 1 });
MembershipSchema.index({ isActive: 1 });

// Méthode pour vérifier si l'adhésion est active
MembershipSchema.methods.isActiveNow = function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Méthode pour vérifier si l'adhésion expire bientôt (dans les 30 jours)
MembershipSchema.methods.isExpiringSoon = function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return this.isActive && this.endDate <= thirtyDaysFromNow && this.endDate > now;
};

module.exports = mongoose.model('Membership', MembershipSchema);
