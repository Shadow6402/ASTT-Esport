import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Badge, Modal, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { Formik } from 'formik';
import * as Yup from 'yup';

const MembershipManagement = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        setLoading(false);
        return;
      }

      // Récupérer tous les utilisateurs
      const usersRes = await axios.get('/api/users', {
        headers: {
          'x-auth-token': token
        }
      });

      setUsers(usersRes.data);

      // Récupérer les adhésions selon le filtre
      let endpoint = '/api/memberships';
      if (filter === 'active') {
        endpoint = '/api/memberships/active';
      } else if (filter === 'expiring') {
        endpoint = '/api/memberships/expiring';
      } else if (filter === 'expired') {
        endpoint = '/api/memberships/expired';
      }

      const membershipsRes = await axios.get(endpoint, {
        headers: {
          'x-auth-token': token
        }
      });

      setMemberships(membershipsRes.data);
      setLoading(false);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des données'
      );
      setLoading(false);
    }
  };

  const handleNotifyExpiring = async () => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour effectuer cette action');
        return;
      }

      // Envoyer les notifications
      const res = await axios.post('/api/memberships/notify-expiring', {}, {
        headers: {
          'x-auth-token': token
        }
      });

      setSuccess(res.data.msg);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de l\'envoi des notifications'
      );
    }
  };

  const handleArchiveExpired = async () => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour effectuer cette action');
        return;
      }

      // Archiver les adhésions expirées
      const res = await axios.post('/api/memberships/archive', {}, {
        headers: {
          'x-auth-token': token
        }
      });

      setSuccess(res.data.msg);
      fetchData();
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de l\'archivage des adhésions'
      );
    }
  };

  // Schéma de validation pour la création d'adhésion
  const membershipValidationSchema = Yup.object({
    userId: Yup.string().required('L\'utilisateur est requis'),
    membershipType: Yup.string().required('Le type d\'adhésion est requis'),
    startDate: Yup.date().required('La date de début est requise'),
    endDate: Yup.date()
      .required('La date de fin est requise')
      .min(Yup.ref('startDate'), 'La date de fin doit être postérieure à la date de début'),
    paymentMethod: Yup.string().required('La méthode de paiement est requise'),
    paymentAmount: Yup.number()
      .required('Le montant du paiement est requis')
      .min(0, 'Le montant doit être positif'),
    paymentStatus: Yup.string().required('Le statut du paiement est requis'),
    notes: Yup.string()
  });

  const handleCreateSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour créer une adhésion');
        setSubmitting(false);
        return;
      }

      // Créer l'adhésion
      const res = await axios.post('/api/memberships', values, {
        headers: {
          'x-auth-token': token
        }
      });

      // Fermer le modal et réinitialiser le formulaire
      setShowCreateModal(false);
      resetForm();

      // Mettre à jour la liste des adhésions
      fetchData();

      setSuccess('Adhésion créée avec succès');
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la création de l\'adhésion'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour renouveler une adhésion');
        setSubmitting(false);
        return;
      }

      // Renouveler l'adhésion
      const res = await axios.post(`/api/memberships/renew/${selectedMembership._id}`, values, {
        headers: {
          'x-auth-token': token
        }
      });

      // Fermer le modal et réinitialiser le formulaire
      setShowRenewModal(false);
      setSelectedMembership(null);
      resetForm();

      // Mettre à jour la liste des adhésions
      fetchData();

      setSuccess('Adhésion renouvelée avec succès');
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors du renouvellement de l\'adhésion'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrer les adhésions en fonction de la recherche
  const filteredMemberships = memberships.filter(membership => {
    if (!membership.user) return false;
    
    const fullName = `${membership.user.firstName} ${membership.user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           membership.user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des adhésions...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Gestion des Adhésions</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            className="me-2"
          >
            <i className="fas fa-plus me-2"></i>
            Nouvelle adhésion
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={handleNotifyExpiring}
            className="me-2"
          >
            <i className="fas fa-bell me-2"></i>
            Notifier les expirations
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={handleArchiveExpired}
          >
            <i className="fas fa-archive me-2"></i>
            Archiver les expirées
          </Button>
        </div>
        <div className="d-flex">
          <Form.Control
            type="text"
            placeholder="Rechercher un membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="me-2"
            style={{ width: '250px' }}
          />
          <Form.Select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="expiring">Expirantes</option>
            <option value="expired">Expirées</option>
          </Form.Select>
        </div>
      </div>

      <Card className="shadow">
        <Card.Header className="bg-gradient-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Liste des adhésions</h4>
            <Button variant="light" size="sm" onClick={fetchData}>
              <i className="fas fa-sync-alt me-1"></i> Actualiser
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredMemberships.length === 0 ? (
            <div className="text-center py-4">
              <p>Aucune adhésion trouvée.</p>
              <Button 
                variant="outline-primary" 
                onClick={() => setShowCreateModal(true)}
              >
                Créer une nouvelle adhésion
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Membre</th>
                    <th>Type</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.map(membership => (
                    <tr key={membership._id}>
                      <td>
                        {membership.user ? (
                          <>
                            {membership.user.firstName} {membership.user.lastName}
                            <div className="small text-muted">{membership.user.email}</div>
                          </>
                        ) : (
                          <span className="text-muted">Utilisateur supprimé</span>
                        )}
                      </td>
                      <td>{membership.membershipType}</td>
                      <td>{new Date(membership.startDate).toLocaleDateString()}</td>
                      <td>{new Date(membership.endDate).toLocaleDateString()}</td>
                      <td>
                        {membership.isActive ? (
                          new Date(membership.endDate) < new Date() ? (
                            <Badge bg="danger">Expirée</Badge>
                          ) : new Date(membership.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? (
                            <Badge bg="warning">Expire bientôt</Badge>
                          ) : (
                            <Badge bg="success">Active</Badge>
                          )
                        ) : (
                          <Badge bg="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td>
                        {membership.paymentStatus === 'Payé' ? (
                          <Badge bg="success">Payé</Badge>
                        ) : membership.paymentStatus === 'En attente' ? (
                          <Badge bg="warning">En attente</Badge>
                        ) : (
                          <Badge bg="danger">Non payé</Badge>
                        )}
                        <div className="small">{membership.paymentAmount} € ({membership.paymentMethod})</div>
                      </td>
                      <td>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="me-1"
                          onClick={() => {
                            setSelectedMembership(membership);
                            setShowRenewModal(true);
                          }}
                        >
                          <i className="fas fa-sync-alt"></i>
                        </Button>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-1"
                          href={`/admin/memberships/${membership._id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de création d'adhésion */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Créer une nouvelle adhésion</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            userId: '',
            membershipType: 'Standard',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paymentMethod: 'Carte bancaire',
            paymentAmount: 50,
            paymentStatus: 'Payé',
            notes: ''
          }}
          validationSchema={membershipValidationSchema}
          onSubmit={handleCreateSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting
          }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Membre *</Form.Label>
                  <Form.Select
                    name="userId"
                    value={values.userId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.userId && errors.userId}
                  >
                    <option value="">Sélectionner un membre</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.userId}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type d'adhésion *</Form.Label>
                      <Form.Select
                        name="membershipType"
                        value={values.membershipType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.membershipType && errors.membershipType}
                      >
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Famille">Famille</option>
                        <option value="Étudiant">Étudiant</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.membershipType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Montant du paiement (€) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="paymentAmount"
                        value={values.paymentAmount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.paymentAmount && errors.paymentAmount}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.paymentAmount}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date de début *</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={values.startDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.startDate && errors.startDate}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.startDate}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date de fin *</Form.Label>
                      <Form.Control
                        type="date"
                        name="endDate"
                        value={values.endDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.endDate && errors.endDate}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.endDate}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Méthode de paiement *</Form.Label>
                      <Form.Select
                        name="paymentMethod"
                        value={values.paymentMethod}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.paymentMethod && errors.paymentMethod}
                      >
                        <option value="Carte bancaire">Carte bancaire</option>
                        <option value="Espèces">Espèces</option>
                        <option value="Chèque">Chèque</option>
                        <option value="Virement">Virement</option>
                        <option value="PayPal">PayPal</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.paymentMethod}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Statut du paiement *</Form.Label>
                      <Form.Select
                        name="paymentStatus"
                        value={values.paymentStatus}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.paymentStatus && errors.paymentStatus}
                      >
                        <option value="Payé">Payé</option>
                        <option value="En attente">En attente</option>
                        <option value="Non payé">Non payé</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.paymentStatus}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={values.notes}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.notes && errors.notes}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.notes}
                  </Form.Control.Feedback>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Création en cours...' : 'Créer l\'adhésion'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Modal de renouvellement d'adhésion */}
      <Modal show={showRenewModal} onHide={() => setShowRenewModal(false)} size="lg">
        {selectedMembership && (
          <Modal.Header closeButton>
            <Modal.Title>Renouveler l'adhésion de {selectedMembership.user?.firstName} {selectedMembership.user?.lastName}</Modal.Title>
          </Modal.Header>
        )}
        {selectedMembership && (
          <Formik
            initialValues={{
              membershipType: selectedMembership.membershipType,
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              paymentMethod: 'Carte bancaire',
              paymentAmount: selectedMembership.paymentAmount,
              paymentStatus: 'Payé',
              notes: ''
            }}
            validationSchema={Yup.object({
              membershipType: Yup.string().required('Le type d\'adhésion est requis'),
              startDate: Yup.date().required('La date de début est requise'),
              endDate: Yup.date()
                .required('La date de fin est requise')
                .min(Yup.ref('startDate'), 'La date de fin doit être postérieure à la date de début'),
              paymentMethod: Yup.string().required('La méthode de paiement est requise'),
              paymentAmount: Yup.number()
                .required('Le montant du paiement est requis')
                .min(0, 'Le montant doit être positif'),
              paymentStatus: Yup.string().required('Le statut du paiement est requis'),
              notes: Yup.string()
            })}
            onSubmit={handleRenewSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting
            }) => (
              <Form onSubmit={handleSubmit}>
                <Modal.Body>
                  <Alert variant="info">
                    <i className="fas fa-info-circle me-2"></i>
                    Vous êtes sur le point de renouveler l'adhésion qui expire le {new Date(selectedMembership.endDate).toLocaleDateString()}.
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Type d'adhésion *</Form.Label>
                        <Form.Select
                          name="membershipType"
                          value={values.membershipType}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.membershipType && errors.membershipType}
                        >
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                          <option value="Famille">Famille</option>
                          <option value="Étudiant">Étudiant</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.membershipType}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Montant du paiement (€) *</Form.Label>
                        <Form.Control
                          type="number"
                          name="paymentAmount"
                          value={values.paymentAmount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.paymentAmount && errors.paymentAmount}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.paymentAmount}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date de début *</Form.Label>
                        <Form.Control
                          type="date"
                          name="startDate"
                          value={values.startDate}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.startDate && errors.startDate}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.startDate}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date de fin *</Form.Label>
                        <Form.Control
                          type="date"
                          name="endDate"
                          value={values.endDate}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.endDate && errors.endDate}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.endDate}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Méthode de paiement *</Form.Label>
                        <Form.Select
                          name="paymentMethod"
                          value={values.paymentMethod}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.paymentMethod && errors.paymentMethod}
                        >
                          <option value="Carte bancaire">Carte bancaire</option>
                          <option value="Espèces">Espèces</option>
                          <option value="Chèque">Chèque</option>
                          <option value="Virement">Virement</option>
                          <option value="PayPal">PayPal</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.paymentMethod}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Statut du paiement *</Form.Label>
                        <Form.Select
                          name="paymentStatus"
                          value={values.paymentStatus}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.paymentStatus && errors.paymentStatus}
                        >
                          <option value="Payé">Payé</option>
                          <option value="En attente">En attente</option>
                          <option value="Non payé">Non payé</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.paymentStatus}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={values.notes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.notes && errors.notes}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.notes}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowRenewModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Renouvellement en cours...' : 'Renouveler l\'adhésion'}
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        )}
      </Modal>
    </Container>
  );
};

export default MembershipManagement;
