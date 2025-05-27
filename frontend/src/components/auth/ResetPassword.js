import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ResetPassword = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  // Schéma de validation avec Yup
  const validationSchema = Yup.object({
    password: Yup.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').required('Le mot de passe est requis'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Les mots de passe doivent correspondre')
      .required('La confirmation du mot de passe est requise')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      // Appel à l'API pour la réinitialisation du mot de passe
      await axios.post(`/api/auth/reset-password/${token}`, {
        password: values.password
      });
      
      setSuccess(true);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de la réinitialisation du mot de passe'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Header className="bg-gradient-primary text-white text-center py-3">
              <h2>Réinitialisation du mot de passe</h2>
              <p className="mb-0">Créez un nouveau mot de passe</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
                </Alert>
              )}

              {!success && (
                <Formik
                  initialValues={{
                    password: '',
                    confirmPassword: ''
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
                      <Form.Group className="mb-3">
                        <Form.Label>Nouveau mot de passe</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.password && errors.password}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Confirmer le mot de passe</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={values.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.confirmPassword && errors.confirmPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mt-3"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
                      </Button>
                    </Form>
                  )}
                </Formik>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResetPassword;
