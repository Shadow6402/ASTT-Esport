const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Membership = require('../models/Membership');
const User = require('../models/User');
const AccessCode = require('../models/AccessCode');
const emailService = require('../utils/emailService');

// @route   POST api/memberships
// @desc    Créer une nouvelle adhésion
// @access  Private/Admin
router.post('/', [auth, checkRole('admin')], async (req, res) => {
  try {
    const {
      userId,
      membershipType,
      startDate,
      endDate,
      paymentMethod,
      paymentAmount,
      paymentStatus,
      notes
    } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà une adhésion active
    const existingMembership = await Membership.findOne({
      user: userId,
      isActive: true,
      endDate: { $gte: new Date() }
    });

    if (existingMembership) {
      return res.status(400).json({ msg: 'L\'utilisateur a déjà une adhésion active' });
    }

    // Créer une nouvelle adhésion
    const membership = new Membership({
      user: userId,
      membershipType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      paymentMethod,
      paymentAmount,
      paymentStatus,
      notes,
      createdBy: req.user.id
    });

    await membership.save();

    // Mettre à jour le statut de l'utilisateur
    user.status = 'Actif';
    await user.save();

    res.json(membership);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/memberships
// @desc    Récupérer toutes les adhésions
// @access  Private/Admin
router.get('/', [auth, checkRole('admin')], async (req, res) => {
  try {
    const memberships = await Membership.find()
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');
    
    res.json(memberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/memberships/active
// @desc    Récupérer toutes les adhésions actives
// @access  Private/Admin
router.get('/active', [auth, checkRole('admin')], async (req, res) => {
  try {
    const memberships = await Membership.find({
      isActive: true,
      endDate: { $gte: new Date() }
    })
      .sort({ endDate: 1 })
      .populate('user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');
    
    res.json(memberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/memberships/expiring
// @desc    Récupérer les adhésions qui expirent bientôt
// @access  Private/Admin
router.get('/expiring', [auth, checkRole('admin')], async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const now = new Date();
    const memberships = await Membership.find({
      isActive: true,
      endDate: { $lte: thirtyDaysFromNow, $gt: now }
    })
      .sort({ endDate: 1 })
      .populate('user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');
    
    res.json(memberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/memberships/expired
// @desc    Récupérer les adhésions expirées
// @access  Private/Admin
router.get('/expired', [auth, checkRole('admin')], async (req, res) => {
  try {
    const now = new Date();
    const memberships = await Membership.find({
      endDate: { $lt: now }
    })
      .sort({ endDate: -1 })
      .populate('user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');
    
    res.json(memberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/memberships/user/:userId
// @desc    Récupérer les adhésions d'un utilisateur
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est autorisé à voir ces adhésions
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Accès refusé' });
    }

    const memberships = await Membership.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName');
    
    res.json(memberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/memberships/:id
// @desc    Récupérer une adhésion par son ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');
    
    if (!membership) {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }
    
    // Vérifier si l'utilisateur est autorisé à voir cette adhésion
    if (req.user.id !== membership.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Accès refusé' });
    }
    
    res.json(membership);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/memberships/:id
// @desc    Mettre à jour une adhésion
// @access  Private/Admin
router.put('/:id', [auth, checkRole('admin')], async (req, res) => {
  try {
    const {
      membershipType,
      startDate,
      endDate,
      paymentMethod,
      paymentAmount,
      paymentStatus,
      isActive,
      notes
    } = req.body;

    // Récupérer l'adhésion
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }

    // Mettre à jour les champs
    if (membershipType) membership.membershipType = membershipType;
    if (startDate) membership.startDate = new Date(startDate);
    if (endDate) membership.endDate = new Date(endDate);
    if (paymentMethod) membership.paymentMethod = paymentMethod;
    if (paymentAmount) membership.paymentAmount = paymentAmount;
    if (paymentStatus) membership.paymentStatus = paymentStatus;
    if (isActive !== undefined) membership.isActive = isActive;
    if (notes) membership.notes = notes;

    membership.updatedAt = Date.now();
    membership.updatedBy = req.user.id;

    await membership.save();

    // Si l'adhésion est désactivée, mettre à jour le statut de l'utilisateur
    if (isActive === false) {
      const user = await User.findById(membership.user);
      if (user) {
        user.status = 'Expiré';
        await user.save();
      }
    }
    
    res.json(membership);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/memberships/renew/:id
// @desc    Renouveler une adhésion
// @access  Private/Admin
router.post('/renew/:id', [auth, checkRole('admin')], async (req, res) => {
  try {
    const {
      membershipType,
      startDate,
      endDate,
      paymentMethod,
      paymentAmount,
      paymentStatus,
      notes
    } = req.body;

    // Récupérer l'ancienne adhésion
    const oldMembership = await Membership.findById(req.params.id);
    if (!oldMembership) {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }

    // Désactiver l'ancienne adhésion
    oldMembership.isActive = false;
    oldMembership.updatedAt = Date.now();
    oldMembership.updatedBy = req.user.id;
    await oldMembership.save();

    // Créer une nouvelle adhésion
    const newMembership = new Membership({
      user: oldMembership.user,
      membershipType: membershipType || oldMembership.membershipType,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      paymentMethod,
      paymentAmount,
      paymentStatus,
      notes,
      createdBy: req.user.id
    });

    await newMembership.save();

    // Mettre à jour le statut de l'utilisateur
    const user = await User.findById(oldMembership.user);
    if (user) {
      user.status = 'Actif';
      await user.save();
    }

    res.json({
      msg: 'Adhésion renouvelée avec succès',
      oldMembership,
      newMembership
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE api/memberships/:id
// @desc    Supprimer une adhésion
// @access  Private/Admin
router.delete('/:id', [auth, checkRole('admin')], async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }

    await membership.remove();
    
    res.json({ msg: 'Adhésion supprimée' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Adhésion non trouvée' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/memberships/notify-expiring
// @desc    Notifier les utilisateurs dont l'adhésion expire bientôt
// @access  Private/Admin
router.post('/notify-expiring', [auth, checkRole('admin')], async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));
    
    const now = new Date();
    const memberships = await Membership.find({
      isActive: true,
      endDate: { $lte: expiryDate, $gt: now },
      notificationSent: false
    }).populate('user', 'firstName lastName email');
    
    if (memberships.length === 0) {
      return res.json({ msg: 'Aucune adhésion expirante à notifier' });
    }
    
    // Envoyer les notifications
    const notified = [];
    for (const membership of memberships) {
      try {
        // Envoyer l'email de notification
        await emailService.sendExpirationNotification(membership.user, membership);
        
        // Marquer la notification comme envoyée
        membership.notificationSent = true;
        await membership.save();
        
        notified.push(membership._id);
      } catch (error) {
        console.error(`Erreur lors de l'envoi de la notification pour l'adhésion ${membership._id}:`, error);
      }
    }
    
    res.json({
      msg: `${notified.length} notifications envoyées`,
      notified
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/memberships/archive
// @desc    Archiver les adhésions expirées
// @access  Private/Admin
router.post('/archive', [auth, checkRole('admin')], async (req, res) => {
  try {
    const { months = 6 } = req.body;
    
    const archiveDate = new Date();
    archiveDate.setMonth(archiveDate.getMonth() - parseInt(months));
    
    const memberships = await Membership.find({
      isActive: false,
      endDate: { $lt: archiveDate },
      isArchived: false
    });
    
    if (memberships.length === 0) {
      return res.json({ msg: 'Aucune adhésion à archiver' });
    }
    
    // Archiver les adhésions
    const archived = [];
    for (const membership of memberships) {
      membership.isArchived = true;
      await membership.save();
      archived.push(membership._id);
    }
    
    res.json({
      msg: `${archived.length} adhésions archivées`,
      archived
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
