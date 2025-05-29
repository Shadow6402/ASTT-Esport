const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/2fa/setup
// @desc    Configurer l'authentification à deux facteurs
// @access  Private
router.post('/setup', auth, async (req, res) => {
  try {
    // Générer un secret temporaire
    const secret = speakeasy.generateSecret({
      name: `ASTT E-sport VR (${req.user.email})`
    });

    // Trouver l'utilisateur
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    // Stocker le secret temporaire
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    // Générer un QR code
    qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Erreur lors de la génération du QR code' });
      }
      
      res.json({
        secret: secret.base32,
        qrCode: dataUrl
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/2fa/verify
// @desc    Vérifier et activer l'authentification à deux facteurs
// @access  Private
router.post('/verify', auth, async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ msg: 'Token requis' });
  }
  
  try {
    // Trouver l'utilisateur
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    // Vérifier le token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      return res.status(400).json({ msg: 'Token invalide' });
    }
    
    // Activer l'authentification à deux facteurs
    user.twoFactorEnabled = true;
    await user.save();
    
    res.json({ msg: 'Authentification à deux facteurs activée avec succès' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/2fa/validate
// @desc    Valider un token 2FA lors de la connexion
// @access  Public
router.post('/validate', async (req, res) => {
  const { email, token } = req.body;
  
  if (!email || !token) {
    return res.status(400).json({ msg: 'Email et token requis' });
  }
  
  try {
    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si 2FA est activé
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ msg: 'Authentification à deux facteurs non activée pour cet utilisateur' });
    }
    
    // Vérifier le token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      return res.status(400).json({ msg: 'Token invalide' });
    }
    
    res.json({ msg: 'Token validé avec succès' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE api/2fa/disable
// @desc    Désactiver l'authentification à deux facteurs
// @access  Private
router.delete('/disable', auth, async (req, res) => {
  try {
    // Trouver l'utilisateur
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    // Désactiver l'authentification à deux facteurs
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
    
    res.json({ msg: 'Authentification à deux facteurs désactivée avec succès' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
