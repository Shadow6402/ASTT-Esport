import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Modal, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { Formik } from 'formik';
import * as Yup from 'yup';

const CodeAssignment = () => {
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [availableCodes, setAvailableCodes] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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

      // Récupérer tous les lots de codes
      const batchesRes = await axios.get('/api/codes/batches', {
        headers: {
          'x-auth-token': token
        }
      });

      setUsers(usersRes.data);
      setBatches(batchesRes.data);
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

  const handleBatchChange = async (batchId) => {
    try {
      setSelectedBatch(batchId);
      
      if (!batchId) {
        setAvailableCodes(0);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        return;
      }

      // Récupérer tous les codes du lot
      const res = await axios.get(`/api/codes/batch/${batchId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      // Compter les codes disponibles
      const available = res.data.filter(code => !code.assignedTo).length;
      setAvailableCodes(available);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des codes disponibles'
      );
    }
  };

  // Schéma de validation pour l'attribution de codes
  const assignmentValidationSchema = Yup.object({
    userId: Yup.string().required('L\'utilisateur est requis'),
    batchId: Yup.string().required('Le lot de codes est requis'),
    count: Yup.number()
      .required('Le nombre de codes est requis')
      .min(1, 'Le nombre de codes doit être au moins 1')
      .max(100, 'Le nombre de codes ne peut pas dépasser 100')
  });

  const handleAssignSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour attribuer des codes');
        setSubmitting(false);
        return;
      }

      // Attribuer les codes
      const res = await axios.post('/api/codes/assign', {
        userId: values.userId,
        batchId: values.batchId,
        count: values.count
      }, {
        headers: {
          'x-auth-token': token
        }
      });

      // Réinitialiser le formulaire
      resetForm();
      setSelectedBatch('');
      setSelectedUser('');
      setAvailableCodes(0);

      // Mettre à jour les lots
      fetchData();

      setSuccess(res.data.msg);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de l\'attribution des codes'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des données...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Attribution des Codes d'Accès</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col lg={5}>
          <Card className="shadow mb-4">
            <Card.Header className="bg-gradient-primary text-white">
              <h4 className="mb-0">Attribuer des codes</h4>
            </Card.Header>
            <Card.Body>
              <Formik
                initialValues={{
                  userId: selectedUser,
                  batchId: selectedBatch,
                  count: 1
                }}
                validationSchema={assignmentValidationSchema}
                onSubmit={handleAssignSubmit}
                enableReinitialize
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
                    <Form.Group className="mb-3">
                      <Form.Label>Lot de codes *</Form.Label>
                      <Form.Select
                        name="batchId"
                        value={values.batchId}
                        onChange={(e) => {
                          handleChange(e);
                          handleBatchChange(e.target.value);
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.batchId && errors.batchId}
                      >
                        <option value="">Sélectionner un lot</option>
                        {batches.map(batch => (
                          <option key={batch._id} value={batch._id}>
                            {batch.name} ({batch.totalCodes - batch.assignedCodes} codes disponibles)
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.batchId}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Utilisateur *</Form.Label>
                      <Form.Select
                        name="userId"
                        value={values.userId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.userId && errors.userId}
                      >
                        <option value="">Sélectionner un utilisateur</option>
                        {filteredUsers.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.userId}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Seuls les utilisateurs avec un statut "Actif" sont affichés.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Nombre de codes *</Form.Label>
                      <Form.Control
                        type="number"
                        name="count"
                        value={values.count}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.count && errors.count}
                        min="1"
                        max={availableCodes}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.count}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        {availableCodes > 0 ? 
                          `${availableCodes} codes disponibles dans ce lot` : 
                          'Veuillez sélectionner un lot pour voir les codes disponibles'}
                      </Form.Text>
                    </Form.Group>

                    <div className="d-grid gap-2 mt-4">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting || availableCodes === 0}
                      >
                        {isSubmitting ? 'Attribution en cours...' : 'Attribuer les codes'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="shadow">
            <Card.Header className="bg-gradient-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Utilisateurs</h4>
                <Form.Control
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '250px' }}
                />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center">Aucun utilisateur trouvé</td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user._id}>
                          <td>{user.firstName} {user.lastName}</td>
                          <td>{user.email}</td>
                          <td>
                            {user.status === 'Actif' && <span className="badge bg-success">Actif</span>}
                            {user.status === 'En attente' && <span className="badge bg-warning">En attente</span>}
                            {user.status === 'Expiré' && <span className="badge bg-danger">Expiré</span>}
                          </td>
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedUser(user._id)}
                            >
                              Sélectionner
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CodeAssignment;
