const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const AccessCode = require('../models/AccessCode');
const CodeBatch = require('../models/CodeBatch');
const User = require('../models/User');

// Configuration de multer pour l'upload de fichiers Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont autorisés'));
    }
  }
});

// @route   POST api/codes/import
// @desc    Importer des codes d'accès depuis un fichier Excel
// @access  Private/Admin
router.post('/import', [auth, checkRole('admin'), upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Aucun fichier n\'a été téléchargé' });
    }

    const { name, description, expiryDate } = req.body;

    if (!name || !expiryDate) {
      return res.status(400).json({ msg: 'Le nom du lot et la date d\'expiration sont requis' });
    }

    // Lire le fichier Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ msg: 'Le fichier Excel ne contient aucune donnée' });
    }

    // Créer un nouveau lot de codes
    const codeBatch = new CodeBatch({
      name,
      description,
      importedBy: req.user.id,
      totalCodes: data.length,
      expiryDate: new Date(expiryDate),
      sourceFile: req.file.filename
    });

    await codeBatch.save();

    // Extraire les codes du fichier Excel et les enregistrer dans la base de données
    const codes = [];
    const errors = [];

    for (const row of data) {
      // Vérifier si la colonne 'code' existe
      if (!row.code && !row.Code && !row.CODE) {
        errors.push(`Une ligne ne contient pas de code valide`);
        continue;
      }

      // Récupérer le code (quelle que soit la casse utilisée dans l'en-tête)
      const code = row.code || row.Code || row.CODE;

      // Vérifier si le code existe déjà
      const existingCode = await AccessCode.findOne({ code });
      if (existingCode) {
        errors.push(`Le code ${code} existe déjà dans la base de données`);
        continue;
      }

      // Créer un nouvel objet AccessCode
      const accessCode = new AccessCode({
        code,
        batchId: codeBatch._id,
        expiresAt: new Date(expiryDate)
      });

      codes.push(accessCode);
    }

    // Enregistrer tous les codes dans la base de données
    if (codes.length > 0) {
      await AccessCode.insertMany(codes);
    }

    // Mettre à jour le nombre total de codes dans le lot
    codeBatch.totalCodes = codes.length;
    await codeBatch.save();

    // Supprimer le fichier Excel après traitement
    fs.unlinkSync(req.file.path);

    res.json({
      msg: `${codes.length} codes importés avec succès`,
      batchId: codeBatch._id,
      totalCodes: codes.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/codes/batches
// @desc    Récupérer tous les lots de codes
// @access  Private/Admin
router.get('/batches', [auth, checkRole('admin')], async (req, res) => {
  try {
    const batches = await CodeBatch.find()
      .sort({ importedAt: -1 })
      .populate('importedBy', 'firstName lastName');
    
    res.json(batches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/codes/batches/:id
// @desc    Récupérer un lot de codes par son ID
// @access  Private/Admin
router.get('/batches/:id', [auth, checkRole('admin')], async (req, res) => {
  try {
    const batch = await CodeBatch.findById(req.params.id)
      .populate('importedBy', 'firstName lastName');
    
    if (!batch) {
      return res.status(404).json({ msg: 'Lot de codes non trouvé' });
    }
    
    res.json(batch);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lot de codes non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/codes/batch/:batchId
// @desc    Récupérer tous les codes d'un lot
// @access  Private/Admin
router.get('/batch/:batchId', [auth, checkRole('admin')], async (req, res) => {
  try {
    const codes = await AccessCode.find({ batchId: req.params.batchId })
      .populate('assignedTo', 'firstName lastName email');
    
    res.json(codes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST api/codes/assign
// @desc    Attribuer des codes à un utilisateur
// @access  Private/Admin
router.post('/assign', [auth, checkRole('admin')], async (req, res) => {
  try {
    const { userId, batchId, count } = req.body;

    if (!userId || !batchId || !count) {
      return res.status(400).json({ msg: 'L\'ID utilisateur, l\'ID du lot et le nombre de codes sont requis' });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    // Vérifier si le lot existe
    const batch = await CodeBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ msg: 'Lot de codes non trouvé' });
    }

    // Récupérer les codes non attribués du lot
    const unassignedCodes = await AccessCode.find({
      batchId,
      assignedTo: null,
      isUsed: false
    }).limit(parseInt(count));

    if (unassignedCodes.length === 0) {
      return res.status(400).json({ msg: 'Aucun code disponible dans ce lot' });
    }

    if (unassignedCodes.length < count) {
      return res.status(400).json({ msg: `Seulement ${unassignedCodes.length} codes disponibles dans ce lot` });
    }

    // Attribuer les codes à l'utilisateur
    const assignedCodes = [];
    for (const code of unassignedCodes) {
      code.assignedTo = userId;
      code.assignedAt = Date.now();
      await code.save();
      assignedCodes.push(code);
    }

    // Mettre à jour le nombre de codes attribués dans le lot
    batch.assignedCodes += assignedCodes.length;
    await batch.save();

    res.json({
      msg: `${assignedCodes.length} codes attribués avec succès à ${user.firstName} ${user.lastName}`,
      assignedCodes
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/codes/user/:userId
// @desc    Récupérer tous les codes attribués à un utilisateur
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est autorisé à voir ces codes
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Accès refusé' });
    }

    const codes = await AccessCode.find({
      assignedTo: req.params.userId,
      expiresAt: { $gte: new Date() }
    }).sort({ assignedAt: -1 });
    
    res.json(codes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/codes/:id
// @desc    Mettre à jour un code d'accès
// @access  Private/Admin
router.put('/:id', [auth, checkRole('admin')], async (req, res) => {
  try {
    const { isUsed, assignedTo } = req.body;

    // Récupérer le code
    const code = await AccessCode.findById(req.params.id);
    if (!code) {
      return res.status(404).json({ msg: 'Code non trouvé' });
    }

    // Mettre à jour les champs
    if (isUsed !== undefined) code.isUsed = isUsed;
    
    if (assignedTo !== undefined) {
      // Si on change l'attribution, mettre à jour le compteur du lot
      if (code.assignedTo !== assignedTo) {
        const batch = await CodeBatch.findById(code.batchId);
        if (batch) {
          if (code.assignedTo === null && assignedTo !== null) {
            batch.assignedCodes += 1;
          } else if (code.assignedTo !== null && assignedTo === null) {
            batch.assignedCodes -= 1;
          }
          await batch.save();
        }
      }
      
      code.assignedTo = assignedTo;
      code.assignedAt = assignedTo ? Date.now() : null;
    }

    await code.save();
    
    res.json(code);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Code non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE api/codes/batch/:id
// @desc    Supprimer un lot de codes et tous les codes associés
// @access  Private/Admin
router.delete('/batch/:id', [auth, checkRole('admin')], async (req, res) => {
  try {
    // Vérifier si le lot existe
    const batch = await CodeBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ msg: 'Lot de codes non trouvé' });
    }

    // Supprimer tous les codes du lot
    await AccessCode.deleteMany({ batchId: req.params.id });

    // Supprimer le lot
    await batch.remove();
    
    res.json({ msg: 'Lot de codes et codes associés supprimés' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lot de codes non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
