import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form } from 'react-bootstrap';
import axios from 'axios';

const TwoFactorSetup = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    // Vérifier si l'authentification à deux facteurs est déjà activée
    const checkTwoFactorStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const res = await axios.get('/api/auth/user', {
          headers: {
            'x-auth-token': token
          }
        });

        setIs2FAEnabled(res.data.twoFactorEnabled);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors de la vérification du statut 2FA');
        setLoading(false);
      }
    };

    checkTwoFactorStatus();
  }, []);

  const setupTwoFactor = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour configurer l\'authentification à deux facteurs');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/2fa/setup', {}, {
        headers: {
          'x-auth-token': token
        }
      });

      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors de la configuration de l\'authentification à deux facteurs');
      setLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token || token.length !== 6) {
        setError('Veuillez entrer un code à 6 chiffres');
        setLoading(false);
        return;
      }

      const authToken = localStorage.getItem('token');
      if (!authToken) {
        setError('Vous devez être connecté pour vérifier l\'authentification à deux facteurs');
        setLoading(false);
        return;
      }

      await axios.post('/api/2fa/verify', { token }, {
        headers: {
          'x-auth-token': authToken
        }
      });

      setSuccess('Authentification à deux facteurs activée avec succès');
      setIs2FAEnabled(true);
      setQrCode('');
      setSecret('');
      setToken('');
      setLoading(false);
    } catch (err) {
      setError('Code invalide. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour désactiver l\'authentification à deux facteurs');
        setLoading(false);
        return;
      }

      await axios.delete('/api/2fa/disable', {
        headers: {
          'x-auth-token': token
        }
      });

      setSuccess('Authentification à deux facteurs désactivée avec succès');
      setIs2FAEnabled(false);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors de la désactivation de l\'authentification à deux facteurs');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-gradient-primary text-white text-center py-3">
              <h2>Authentification à deux facteurs</h2>
              <p className="mb-0">Sécurisez votre compte avec l'authentification à deux facteurs</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {is2FAEnabled ? (
                <div>
                  <Alert variant="info">
                    <i className="fas fa-check-circle me-2"></i>
                    L'authentification à deux facteurs est actuellement <strong>activée</strong> pour votre compte.
                  </Alert>
                  <p>
                    L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
                    Chaque fois que vous vous connecterez, vous devrez fournir un code généré par votre application d'authentification.
                  </p>
                  <Button 
                    variant="danger" 
                    className="w-100 mt-3"
                    onClick={disableTwoFactor}
                    disabled={loading}
                  >
                    {loading ? 'Désactivation en cours...' : 'Désactiver l\'authentification à deux facteurs'}
                  </Button>
                </div>
              ) : qrCode ? (
                <div>
                  <Alert variant="warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Veuillez suivre attentivement les étapes ci-dessous pour configurer l'authentification à deux facteurs.
                  </Alert>
                  <div className="text-center mb-4">
                    <h4 className="mb-3">Étape 1: Scannez le code QR</h4>
                    <p>
                      Utilisez une application d'authentification comme Google Authenticator, Authy ou Microsoft Authenticator
                      pour scanner le code QR ci-dessous.
                    </p>
                    <div className="qr-code-container my-4">
                      <img src={qrCode} alt="QR Code pour l'authentification à deux facteurs" className="img-fluid" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="mb-3">Étape 2: Entrez la clé manuellement (si nécessaire)</h4>
                    <p>
                      Si vous ne pouvez pas scanner le code QR, entrez cette clé dans votre application d'authentification:
                    </p>
                    <div className="secret-key bg-light p-3 text-center mb-3 user-select-all">
                      <code>{secret}</code>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3">Étape 3: Vérifiez la configuration</h4>
                    <p>
                      Entrez le code à 6 chiffres généré par votre application d'authentification pour vérifier la configuration:
                    </p>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Code à 6 chiffres"
                        maxLength={6}
                      />
                    </Form.Group>
                    <Button 
                      variant="primary" 
                      className="w-100"
                      onClick={verifyTwoFactor}
                      disabled={loading || token.length !== 6}
                    >
                      {loading ? 'Vérification en cours...' : 'Vérifier et activer'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p>
                    L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
                    Une fois activée, vous devrez fournir un code généré par une application d'authentification en plus de votre mot de passe lors de la connexion.
                  </p>
                  <Alert variant="info">
                    <i className="fas fa-info-circle me-2"></i>
                    Vous aurez besoin d'une application d'authentification comme Google Authenticator, Authy ou Microsoft Authenticator.
                  </Alert>
                  <Button 
                    variant="primary" 
                    className="w-100 mt-3"
                    onClick={setupTwoFactor}
                    disabled={loading}
                  >
                    {loading ? 'Configuration en cours...' : 'Configurer l\'authentification à deux facteurs'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TwoFactorSetup;
