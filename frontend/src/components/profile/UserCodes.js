import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';

const UserCodes = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserCodes();
  }, []);

  const fetchUserCodes = async () => {
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

      // Récupérer les codes de l'utilisateur
      const codesRes = await axios.get(`/api/codes/user/${userId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      setCodes(codesRes.data);
      setLoading(false);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des codes'
      );
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
          <p className="mt-2">Chargement de vos codes d'accès...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Mes Codes d'Accès</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {codes.length === 0 ? (
        <Card className="shadow">
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-ticket-alt fa-4x text-muted"></i>
            </div>
            <h4>Vous n'avez pas encore de codes d'accès</h4>
            <p className="text-muted">
              Les codes d'accès vous permettent d'utiliser les services de notre partenaire E-sport VR.
              Contactez un administrateur si vous pensez que vous devriez avoir des codes.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {codes.map((code, index) => (
            <Col md={6} lg={4} key={code._id} className="mb-4">
              <Card className="shadow h-100">
                <Card.Header className="bg-gradient-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Code #{index + 1}</h5>
                    <Badge bg={code.isUsed ? "secondary" : "success"}>
                      {code.isUsed ? "Utilisé" : "Valide"}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="code-display text-center mb-3 p-3 bg-light rounded">
                    <span className="code-value user-select-all">{code.code}</span>
                  </div>
                  <div className="mt-auto">
                    <p className="mb-1"><strong>Date d'attribution:</strong> {new Date(code.assignedAt).toLocaleDateString()}</p>
                    <p className="mb-0"><strong>Expire le:</strong> {new Date(code.expiresAt).toLocaleDateString()}</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div className="mt-4">
        <Alert variant="info">
          <i className="fas fa-info-circle me-2"></i>
          Ces codes sont personnels et ne doivent pas être partagés. Ils vous permettent d'accéder aux services de notre partenaire E-sport VR.
        </Alert>
      </div>
    </Container>
  );
};

export default UserCodes;
