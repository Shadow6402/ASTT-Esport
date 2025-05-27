import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';

const UserMembership = () => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserMembership();
  }, []);

  const fetchUserMembership = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        setLoading(false);
        return;
      }

      // Récupérer l'ID de l'utilisateur connecté
      const userRes = await axios.get('/api/auth/user', {
        headers: {
          'x-auth-token': token
        }
      });

      setUser(userRes.data);
      const userId = userRes.data._id;

      // Récupérer les adhésions de l'utilisateur
      const membershipsRes = await axios.get(`/api/memberships/user/${userId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      // Trouver l'adhésion active
      const activeMembership = membershipsRes.data.find(m => 
        m.isActive && new Date(m.endDate) > new Date()
      );

      setMembership(activeMembership || (membershipsRes.data.length > 0 ? membershipsRes.data[0] : null));
      setLoading(false);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des données d\'adhésion'
      );
      setLoading(false);
    }
  };

  const getMembershipStatus = (membership) => {
    if (!membership) return { text: 'Aucune adhésion', color: 'danger' };
    
    if (!membership.isActive) return { text: 'Inactive', color: 'secondary' };
    
    const now = new Date();
    const endDate = new Date(membership.endDate);
    
    if (endDate < now) {
      return { text: 'Expirée', color: 'danger' };
    }
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (endDate <= thirtyDaysFromNow) {
      return { text: 'Expire bientôt', color: 'warning' };
    }
    
    return { text: 'Active', color: 'success' };
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement de votre adhésion...</p>
        </div>
      </Container>
    );
  }

  const membershipStatus = getMembershipStatus(membership);

  return (
    <Container className="py-5">
      <h2 className="mb-4">Mon Adhésion</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {!membership ? (
        <Card className="shadow">
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-id-card fa-4x text-muted"></i>
            </div>
            <h4>Vous n'avez pas encore d'adhésion active</h4>
            <p className="text-muted">
              Une adhésion est nécessaire pour accéder aux services E-sport VR.
              Contactez un administrateur pour obtenir une adhésion.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="shadow">
              <Card.Header className="bg-gradient-primary text-white">
                <h4 className="mb-0">Détails de mon adhésion</h4>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-4">
                  <Badge bg={membershipStatus.color} className="p-2 fs-6">
                    {membershipStatus.text}
                  </Badge>
                </div>

                <Row className="mb-4">
                  <Col md={6}>
                    <h5>Informations générales</h5>
                    <p><strong>Type d'adhésion:</strong> {membership.membershipType}</p>
                    <p><strong>Date de début:</strong> {new Date(membership.startDate).toLocaleDateString()}</p>
                    <p><strong>Date de fin:</strong> {new Date(membership.endDate).toLocaleDateString()}</p>
                  </Col>
                  <Col md={6}>
                    <h5>Informations de paiement</h5>
                    <p><strong>Montant:</strong> {membership.paymentAmount} €</p>
                    <p><strong>Méthode:</strong> {membership.paymentMethod}</p>
                    <p>
                      <strong>Statut:</strong>{' '}
                      {membership.paymentStatus === 'Payé' ? (
                        <Badge bg="success">Payé</Badge>
                      ) : membership.paymentStatus === 'En attente' ? (
                        <Badge bg="warning">En attente</Badge>
                      ) : (
                        <Badge bg="danger">Non payé</Badge>
                      )}
                    </p>
                  </Col>
                </Row>

                {membership.notes && (
                  <div className="mt-3">
                    <h5>Notes</h5>
                    <p>{membership.notes}</p>
                  </div>
                )}

                {new Date(membership.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                  <Alert variant="warning" className="mt-4">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Votre adhésion expire {new Date(membership.endDate) < new Date() ? 'a expiré' : 'expire bientôt'}. 
                    Veuillez contacter un administrateur pour la renouveler.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default UserMembership;
