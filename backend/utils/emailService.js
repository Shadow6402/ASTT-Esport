const nodemailer = require('nodemailer');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Créer un transporteur pour l'envoi d'emails
const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  secure: config.emailSecure,
  auth: {
    user: config.emailUser,
    pass: config.emailPassword
  }
});

// Charger un template d'email
const loadTemplate = (templateName) => {
  try {
    const templateDir = path.join(__dirname, '../templates/emails');
    const templatePath = path.join(templateDir, `${templateName}.html`);
    
    // Créer le répertoire des templates s'il n'existe pas
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    // Si le template n'existe pas, créer un template par défaut
    if (!fs.existsSync(templatePath)) {
      const defaultTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b00, #ff3300); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">{{title}}</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Bonjour {{firstName}} {{lastName}},</p>
            
            {{{content}}}
            
            <p>Cordialement,<br>L'équipe ASTT E-sport VR</p>
          </div>
          
          <div style="text-align: center; padding: 10px; font-size: 12px; color: #6c757d;">
            <p>Ce message a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `;
      fs.writeFileSync(templatePath, defaultTemplate);
    }
    
    const template = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(template);
  } catch (error) {
    console.error(`Erreur lors du chargement du template ${templateName}:`, error);
    throw error;
  }
};

/**
 * Envoyer un email avec les codes d'accès à un utilisateur
 * @param {Object} user - L'utilisateur destinataire
 * @param {Array} codes - Les codes d'accès à envoyer
 * @param {Object} batch - Le lot de codes
 * @returns {Promise} - Promesse résolue avec les informations d'envoi
 */
const sendAccessCodes = async (user, codes, batch) => {
  try {
    // Formater les codes pour l'email
    const codesHtml = codes.map((code, index) => {
      return `<div style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                <strong>Code #${index + 1}:</strong> 
                <span style="font-family: monospace; font-size: 16px; background-color: #e9ecef; padding: 3px 6px; border-radius: 3px;">${code.code}</span>
                <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
                  Expire le: ${new Date(code.expiresAt).toLocaleDateString()}
                </div>
              </div>`;
    }).join('');

    // Préparer le contenu de l'email
    const content = `
      <p>Nous avons le plaisir de vous transmettre vos codes d'accès pour l'E-sport VR. Ces codes vous permettront d'accéder aux services de notre partenaire.</p>
      
      <div style="margin: 20px 0;">
        <h3 style="border-bottom: 2px solid #ff6b00; padding-bottom: 5px; color: #333;">Vos codes d'accès</h3>
        ${codesHtml}
      </div>
      
      <p><strong>Lot:</strong> ${batch.name}</p>
      <p><strong>Description:</strong> ${batch.description || 'N/A'}</p>
      
      <div style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0; color: #856404;"><strong>Important:</strong> Ces codes sont personnels et ne doivent pas être partagés.</p>
      </div>
      
      <p>Pour toute question concernant l'utilisation de ces codes, n'hésitez pas à contacter notre équipe.</p>
    `;

    // Charger et compiler le template
    const template = loadTemplate('access-codes');
    const html = template({
      title: 'Vos codes d\'accès E-sport VR',
      firstName: user.firstName,
      lastName: user.lastName,
      content: content
    });

    // Construire les options de l'email
    const mailOptions = {
      from: `"ASTT E-sport VR" <${config.emailUser}>`,
      to: user.email,
      subject: 'Vos codes d\'accès E-sport VR',
      html: html
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

/**
 * Envoyer une notification d'expiration d'adhésion à un utilisateur
 * @param {Object} user - L'utilisateur destinataire
 * @param {Object} membership - L'adhésion qui expire
 * @returns {Promise} - Promesse résolue avec les informations d'envoi
 */
const sendExpirationNotification = async (user, membership) => {
  try {
    // Calculer le nombre de jours avant expiration
    const today = new Date();
    const endDate = new Date(membership.endDate);
    const diffTime = Math.abs(endDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Préparer le contenu de l'email
    const content = `
      <p>Nous vous informons que votre adhésion à l'ASTT E-sport VR arrive à expiration dans <strong>${diffDays} jours</strong>.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="border-bottom: 2px solid #ff6b00; padding-bottom: 5px; color: #333;">Détails de votre adhésion</h3>
        <p><strong>Type d'adhésion:</strong> ${membership.membershipType}</p>
        <p><strong>Date de début:</strong> ${new Date(membership.startDate).toLocaleDateString()}</p>
        <p><strong>Date d'expiration:</strong> ${new Date(membership.endDate).toLocaleDateString()}</p>
      </div>
      
      <p>Pour continuer à bénéficier de nos services et accéder à l'E-sport VR, nous vous invitons à renouveler votre adhésion avant la date d'expiration.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${config.frontendURL}/renew-membership" style="background-color: #ff6b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Renouveler mon adhésion</a>
      </div>
      
      <p>Si vous avez des questions concernant le renouvellement de votre adhésion, n'hésitez pas à nous contacter.</p>
    `;

    // Charger et compiler le template
    const template = loadTemplate('expiration-notification');
    const html = template({
      title: 'Votre adhésion expire bientôt',
      firstName: user.firstName,
      lastName: user.lastName,
      content: content
    });

    // Construire les options de l'email
    const mailOptions = {
      from: `"ASTT E-sport VR" <${config.emailUser}>`,
      to: user.email,
      subject: 'Votre adhésion E-sport VR expire bientôt',
      html: html
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Notification d'expiration envoyée à ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification d\'expiration:', error);
    throw error;
  }
};

/**
 * Envoyer un email de bienvenue à un nouvel utilisateur
 * @param {Object} user - L'utilisateur destinataire
 * @returns {Promise} - Promesse résolue avec les informations d'envoi
 */
const sendWelcomeEmail = async (user) => {
  try {
    // Préparer le contenu de l'email
    const content = `
      <p>Bienvenue dans la communauté ASTT E-sport VR !</p>
      
      <p>Nous sommes ravis de vous compter parmi nos membres. Votre compte a été créé avec succès.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="border-bottom: 2px solid #ff6b00; padding-bottom: 5px; color: #333;">Vos informations</h3>
        <p><strong>Nom:</strong> ${user.firstName} ${user.lastName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Statut:</strong> ${user.status}</p>
      </div>
      
      <p>Pour accéder à votre espace membre, cliquez sur le bouton ci-dessous :</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${config.frontendURL}/login" style="background-color: #ff6b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accéder à mon espace</a>
      </div>
      
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
    `;

    // Charger et compiler le template
    const template = loadTemplate('welcome');
    const html = template({
      title: 'Bienvenue à l\'ASTT E-sport VR',
      firstName: user.firstName,
      lastName: user.lastName,
      content: content
    });

    // Construire les options de l'email
    const mailOptions = {
      from: `"ASTT E-sport VR" <${config.emailUser}>`,
      to: user.email,
      subject: 'Bienvenue à l\'ASTT E-sport VR',
      html: html
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email de bienvenue envoyé à ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    throw error;
  }
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 * @param {Object} user - L'utilisateur destinataire
 * @param {String} resetToken - Le token de réinitialisation
 * @returns {Promise} - Promesse résolue avec les informations d'envoi
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    // Préparer le contenu de l'email
    const resetLink = `${config.frontendURL}/reset-password/${resetToken}`;
    const content = `
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      
      <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" style="background-color: #ff6b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
      </div>
      
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
      
      <p><strong>Note:</strong> Ce lien est valable pendant 1 heure.</p>
    `;

    // Charger et compiler le template
    const template = loadTemplate('password-reset');
    const html = template({
      title: 'Réinitialisation de votre mot de passe',
      firstName: user.firstName,
      lastName: user.lastName,
      content: content
    });

    // Construire les options de l'email
    const mailOptions = {
      from: `"ASTT E-sport VR" <${config.emailUser}>`,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: html
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email de réinitialisation de mot de passe envoyé à ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation de mot de passe:', error);
    throw error;
  }
};

/**
 * Envoyer un email personnalisé
 * @param {Object} options - Options de l'email
 * @returns {Promise} - Promesse résolue avec les informations d'envoi
 */
const sendCustomEmail = async (options) => {
  try {
    const { to, subject, title, content, templateName = 'custom' } = options;
    
    // Extraire le prénom et le nom si disponibles
    let firstName = 'Membre';
    let lastName = '';
    
    if (options.user) {
      firstName = options.user.firstName || 'Membre';
      lastName = options.user.lastName || '';
    }

    // Charger et compiler le template
    const template = loadTemplate(templateName);
    const html = template({
      title: title || subject,
      firstName,
      lastName,
      content
    });

    // Construire les options de l'email
    const mailOptions = {
      from: `"ASTT E-sport VR" <${config.emailUser}>`,
      to,
      subject,
      html
    };

    // Ajouter les CC et BCC si présents
    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email personnalisé envoyé à ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email personnalisé:', error);
    throw error;
  }
};

module.exports = {
  sendAccessCodes,
  sendExpirationNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendCustomEmail
};
