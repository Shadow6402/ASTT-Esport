const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const User = require('../models/User');
const Membership = require('../models/Membership');
const AccessCode = require('../models/AccessCode');
const CodeBatch = require('../models/CodeBatch');

// @route   GET api/dashboard/stats
// @desc    Récupérer les statistiques pour le tableau de bord
// @access  Private/Admin
router.get('/stats', [auth, checkRole('admin')], async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Actif' });
    const pendingUsers = await User.countDocuments({ status: 'En attente' });
    const expiredUsers = await User.countDocuments({ status: 'Expiré' });

    // Statistiques des adhésions
    const totalMemberships = await Membership.countDocuments();
    const now = new Date();
    const activeMemberships = await Membership.countDocuments({
      isActive: true,
      endDate: { $gte: now }
    });
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringMemberships = await Membership.countDocuments({
      isActive: true,
      endDate: { $lte: thirtyDaysFromNow, $gt: now }
    });
    
    const expiredMemberships = await Membership.countDocuments({
      endDate: { $lt: now }
    });

    // Statistiques des adhésions par mois (pour l'année en cours)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    
    const membershipsByMonth = await Membership.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Convertir le résultat en tableau de 12 éléments (un par mois)
    const membershipsByMonthArray = Array(12).fill(0);
    membershipsByMonth.forEach(item => {
      membershipsByMonthArray[item._id - 1] = item.count;
    });

    // Statistiques des codes d'accès
    const totalCodes = await AccessCode.countDocuments();
    const assignedCodes = await AccessCode.countDocuments({ assignedTo: { $ne: null } });
    const availableCodes = await AccessCode.countDocuments({ assignedTo: null });
    const usedCodes = await AccessCode.countDocuments({ isUsed: true });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        expired: expiredUsers
      },
      memberships: {
        total: totalMemberships,
        active: activeMemberships,
        expiring: expiringMemberships,
        expired: expiredMemberships,
        byMonth: membershipsByMonthArray
      },
      codes: {
        total: totalCodes,
        assigned: assignedCodes,
        available: availableCodes,
        used: usedCodes
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/dashboard/recent-users
// @desc    Récupérer les utilisateurs récemment inscrits
// @access  Private/Admin
router.get('/recent-users', [auth, checkRole('admin')], async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(recentUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/dashboard/expiring-memberships
// @desc    Récupérer les adhésions qui expirent bientôt
// @access  Private/Admin
router.get('/expiring-memberships', [auth, checkRole('admin')], async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const now = new Date();
    const expiringMemberships = await Membership.find({
      isActive: true,
      endDate: { $lte: thirtyDaysFromNow, $gt: now }
    })
      .sort({ endDate: 1 })
      .populate('user', 'firstName lastName email')
      .limit(5);
    
    res.json(expiringMemberships);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
