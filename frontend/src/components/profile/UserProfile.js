import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Formik } from 'formik';
import * as Yup from 'yup';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [accessCodes, setAccessCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
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

        const userId = userRes.data._id;

        // Récupérer les données du tableau de bord
        const dashboardRes = await axios.get(`/api/dashboard/user/${userId}`, {
          headers: {
            'x-auth-token': token
          }
        });

        setUser(dashboardRes.data.user);
        setMembership(dashboardRes.data.membership);
        setAccessCodes(dashboardRes.data.accessCodes);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors de la récupération des données utilisateur');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Schéma de validation avec Yup
  const validationSchema = Yup.object({
    firstName: Yup.string().required('Le prénom est requis'),
    lastName: Yup.string().required('Le nom est requis'),
    email: Yup.string().email('Email invalide').required('L\'email est requis'),
    phoneNumber: Yup.string(),
    street: Yup.string(),
    city: Yup.string(),
    postalCode: Yup.string(),
    country: Yup.string()
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour modifier votre profil');
        setSubmitting(false);
        return;
      }

      // Préparer les données pour l'API
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        address: {
          street: values.street,
          city: values.city,
          postalCode: values.postalCode,
          country: values.country
        }
      };

      // Appel à l'API pour mettre à jour le profil
      await axios.put(`/api/users/${user._id}`, userData, {
        headers: {
          'x-auth-token': token
        }
      });

      // Mettre à jour l'état local
      setUser({
        ...user,
        ...userData
      });

      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de la mise à jour du profil'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement de votre profil...</p>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Impossible de charger les données utilisateur. Veuillez vous reconnecter.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Mon Profil</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow">
            <Card.Header className="bg-gradient-primary text-white">
              <h4 className="mb-0">Informations personnelles</h4>
            </Card.Header>
            <Card.Body className="text-center">
              <div className="profile-avatar mb-3">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="rounded-circle"
                    width="100"
                    height="100"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                )}
              </div>
              <h3>{user.firstName} {user.lastName}</h3>
              <p className="text-muted">{user.email}</p>
              <div className="status-badge status-badge-profile mb-3">
                {user.status === 'Actif' && <span className="badge bg-success">Actif</span>}
                {user.status === 'En attente' && <span className="badge bg-warning">En attente</span>}
                {user.status === 'Expiré' && <span className="badge bg-danger">Expiré</span>}
              </div>
              <p>
                <strong>Rôle:</strong> {user.role === 'admin' ? 'Administrateur' : user.role === 'moderator' ? 'Modérateur' : 'Membre'}
              </p>
              <p>
                <strong>Membre depuis:</strong> {new Date(user.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Dernière connexion:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
              </p>
              <Button variant="outline-primary" href="/profile/2fa-setup">
                {user.twoFactorEnabled ? 'Gérer l\'authentification à deux facteurs' : 'Activer l\'authentification à deux facteurs'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="bg-gradient-primary text-white">
              <h4 className="mb-0">Modifier mon profil</h4>
            </Card.Header>
            <Card.Body>
              <Formik
                initialValues={{
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  email: user.email || '',
                  phoneNumber: user.phoneNumber || '',
                  street: user.address?.street || '',
                  city: user.address?.city || '',
                  postalCode: user.address?.postalCode || '',
                  country: user.address?.country || ''
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
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
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Prénom</Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            value={values.firstName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.firstName && errors.firstName}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.firstName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nom</Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            value={values.lastName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.lastName && errors.lastName}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.lastName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Numéro de téléphone</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={values.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.phoneNumber && errors.phoneNumber}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phoneNumber}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <h5 className="mt-4 mb-3">Adresse</h5>

                    <Form.Group className="mb-3">
                      <Form.Label>Rue</Form.Label>
                      <Form.Control
                        type="text"
                        name="street"
                        value={values.street}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.street && errors.street}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.street}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ville</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={values.city}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.city && errors.city}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.city}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Code postal</Form.Label>
                          <Form.Control
                            type="text"
                            name="postalCode"
                            value={values.postalCode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.postalCode && errors.postalCode}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.postalCode}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Pays</Form.Label>
                      <Form.Control
                        type="text"
                        name="country"
                        value={values.country}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.country && errors.country}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.country}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-flex justify-content-between mt-4">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        href="/profile/change-password"
                      >
                        Changer le mot de passe
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>

          {membership && (
            <Card className="shadow mb-4">
              <Card.Header className="bg-gradient-primary text-white">
                <h4 className="mb-0">Mon Adhésion</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Type d'adhésion:</strong> {membership.membershipType}</p>
                    <p><strong>Date de début:</strong> {new Date(membership.startDate).toLocaleDateString()}</p>
                    <p><strong>Date de fin:</strong> {new Date(membership.endDate).toLocaleDateString()}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Statut:</strong> {membership.isActive ? 'Active' : 'Inactive'}</p>
                    <p><strong>Méthode de paiement:</strong> {membership.paymentMethod}</p>
                    <p><strong>Montant payé:</strong> {membership.paymentAmount} €</p>
                  </Col>
                </Row>
                {new Date(membership.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                  <Alert variant="warning" className="mt-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Votre adhésion expire bientôt. Pensez à la renouveler.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}

          {accessCodes && accessCodes.length > 0 && (
            <Card className="shadow">
              <Card.Header className="bg-gradient-primary text-white">
                <h4 className="mb-0">Mes Codes d'Accès</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  {accessCodes.map((code, index) => (
                    <Col md={6} key={code._id}>
                      <div className="code-card mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="mb-0">Code #{index + 1}</h5>
                          <span className="badge bg-success">Valide</span>
                        </div>
                        <div className="code-value user-select-all">{code.code}</div>
                        <p className="mt-2 mb-0 small">Expire le: {new Date(code.expiresAt).toLocaleDateString()}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;
