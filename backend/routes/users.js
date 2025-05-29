const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/users
// @desc    Récupérer tous les utilisateurs (admin seulement)
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Accès refusé, privilèges administrateur requis' });
    }
    
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/users/:id
// @desc    Récupérer un utilisateur par son ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à voir ce profil
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Accès refusé' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Private
router.put('/:id', [
  auth,
  [
    check('firstName', 'Le prénom est requis').not().isEmpty(),
    check('lastName', 'Le nom est requis').not().isEmpty(),
    check('email', 'Veuillez inclure un email valide').isEmail()
  ]
], async (req, res) => {
  // Validation des entrées
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Vérifier si l'utilisateur est autorisé à modifier ce profil
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Accès refusé' });
  }
  
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    address,
    status,
    role,
    uiPreferences
  } = req.body;
  
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'Cet email est déjà utilisé' }] });
      }
    }
    
    // Mettre à jour les champs
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    
    if (address) {
      user.address = address;
    }
    
    // Seul l'admin peut modifier le statut et le rôle
    if (req.user.role === 'admin') {
      if (status) user.status = status;
      if (role) user.role = role;
    }
    
    // Mettre à jour les préférences d'interface
    if (uiPreferences) {
      user.uiPreferences = { ...user.uiPreferences, ...uiPreferences };
    }
    
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/users/password/:id
// @desc    Mettre à jour le mot de passe d'un utilisateur
// @access  Private
router.put('/password/:id', [
  auth,
  [
    check('currentPassword', 'Le mot de passe actuel est requis').exists(),
    check('newPassword', 'Veuillez entrer un nouveau mot de passe avec 6 caractères ou plus').isLength({ min: 6 })
  ]
], async (req, res) => {
  // Validation des entrées
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Vérifier si l'utilisateur est autorisé à modifier ce mot de passe
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Accès refusé' });
  }
  
  const { currentPassword, newPassword } = req.body;
  
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    // Vérifier le mot de passe actuel
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Mot de passe actuel incorrect' }] });
    }
    
    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    res.json({ msg: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE api/users/:id
// @desc    Supprimer un utilisateur
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Accès refusé, privilèges administrateur requis' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    await user.remove();
    
    res.json({ msg: 'Utilisateur supprimé' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
