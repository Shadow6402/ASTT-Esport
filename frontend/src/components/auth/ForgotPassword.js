import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ForgotPassword = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Schéma de validation avec Yup
  const validationSchema = Yup.object({
    email: Yup.string().email('Email invalide').required('L\'email est requis')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      // Appel à l'API pour la réinitialisation du mot de passe
      await axios.post('/api/auth/forgot-password', {
        email: values.email
      });
      
      setSuccess(true);
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de la demande de réinitialisation'
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
              <h2>Mot de passe oublié</h2>
              <p className="mb-0">Réinitialisez votre mot de passe</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  Un email de réinitialisation a été envoyé à l'adresse indiquée si elle est associée à un compte.
                </Alert>
              )}

              {!success && (
                <Formik
                  initialValues={{
                    email: ''
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

                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mt-3"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                      </Button>
                    </Form>
                  )}
                </Formik>
              )}

              <div className="text-center mt-4">
                <p>
                  <a href="/login" className="text-primary">
                    Retour à la connexion
                  </a>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
