import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Formik } from 'formik';
import * as Yup from 'yup';

const UserPreferences = () => {
  const [user, setUser] = useState(null);
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

        // Récupérer les données de l'utilisateur
        const userRes = await axios.get('/api/auth/user', {
          headers: {
            'x-auth-token': token
          }
        });

        setUser(userRes.data);
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
    theme: Yup.string().required('Le thème est requis'),
    fontSize: Yup.string().required('La taille de police est requise'),
    notifications: Yup.boolean()
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour modifier vos préférences');
        setSubmitting(false);
        return;
      }

      // Préparer les données pour l'API
      const userData = {
        uiPreferences: {
          theme: values.theme,
          fontSize: values.fontSize,
          notifications: values.notifications
        }
      };

      // Appel à l'API pour mettre à jour les préférences
      await axios.put(`/api/users/${user._id}`, userData, {
        headers: {
          'x-auth-token': token
        }
      });

      // Mettre à jour l'état local
      setUser({
        ...user,
        uiPreferences: userData.uiPreferences
      });

      setSuccess('Préférences mises à jour avec succès');
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de la mise à jour des préférences'
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
          <p className="mt-2">Chargement de vos préférences...</p>
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
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-gradient-primary text-white">
              <h4 className="mb-0">Préférences d'interface</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Formik
                initialValues={{
                  theme: user.uiPreferences?.theme || 'dark',
                  fontSize: user.uiPreferences?.fontSize || 'medium',
                  notifications: user.uiPreferences?.notifications !== false
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
                    <Form.Group className="mb-4">
                      <Form.Label>Thème</Form.Label>
                      <div className="d-flex gap-3">
                        <div className="theme-option">
                          <Form.Check
                            type="radio"
                            id="theme-dark"
                            name="theme"
                            value="dark"
                            checked={values.theme === 'dark'}
                            onChange={handleChange}
                            label="Sombre"
                            className="mb-2"
                          />
                          <div className="theme-preview theme-dark"></div>
                        </div>
                        <div className="theme-option">
                          <Form.Check
                            type="radio"
                            id="theme-light"
                            name="theme"
                            value="light"
                            checked={values.theme === 'light'}
                            onChange={handleChange}
                            label="Clair"
                            className="mb-2"
                          />
                          <div className="theme-preview theme-light"></div>
                        </div>
                        <div className="theme-option">
                          <Form.Check
                            type="radio"
                            id="theme-contrast"
                            name="theme"
                            value="contrast"
                            checked={values.theme === 'contrast'}
                            onChange={handleChange}
                            label="Contraste élevé"
                            className="mb-2"
                          />
                          <div className="theme-preview theme-contrast"></div>
                        </div>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Taille de police</Form.Label>
                      <Form.Select
                        name="fontSize"
                        value={values.fontSize}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.fontSize && errors.fontSize}
                      >
                        <option value="small">Petite</option>
                        <option value="medium">Moyenne</option>
                        <option value="large">Grande</option>
                        <option value="x-large">Très grande</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.fontSize}
                      </Form.Control.Feedback>
                      <div className="font-size-preview mt-2">
                        <p className={`font-size-${values.fontSize}`}>Exemple de texte avec cette taille</p>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Check
                        type="switch"
                        id="notifications"
                        name="notifications"
                        label="Activer les notifications"
                        checked={values.notifications}
                        onChange={handleChange}
                      />
                      <Form.Text className="text-muted">
                        Recevez des notifications par email concernant votre adhésion, vos codes d'accès et les événements importants.
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-between mt-4">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer les préférences'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        href="/profile"
                      >
                        Retour au profil
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserPreferences;
