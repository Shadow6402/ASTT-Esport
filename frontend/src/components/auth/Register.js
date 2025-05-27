import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Schéma de validation avec Yup
  const validationSchema = Yup.object({
    firstName: Yup.string().required('Le prénom est requis'),
    lastName: Yup.string().required('Le nom est requis'),
    email: Yup.string().email('Email invalide').required('L\'email est requis'),
    password: Yup.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').required('Le mot de passe est requis'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Les mots de passe doivent correspondre')
      .required('La confirmation du mot de passe est requise'),
    phoneNumber: Yup.string(),
    termsAccepted: Yup.boolean().oneOf([true], 'Vous devez accepter les conditions d\'utilisation')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      // Préparer les données pour l'API
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber || ''
      };

      // Appel à l'API pour l'inscription
      const response = await axios.post('/api/auth/register', userData);
      
      // Stocker le token dans le localStorage
      localStorage.setItem('token', response.data.token);
      
      setSuccess(true);
      
      // Rediriger vers la page de profil après 2 secondes
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de l\'inscription'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-gradient-primary text-white text-center py-3">
              <h2>Inscription</h2>
              <p className="mb-0">Créez votre compte pour accéder à l'espace membre</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  Inscription réussie ! Vous allez être redirigé vers votre profil...
                </Alert>
              )}

              <Formik
                initialValues={{
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  phoneNumber: '',
                  termsAccepted: false
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

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Mot de passe</Form.Label>
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
                      </Col>
                      <Col md={6}>
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
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Numéro de téléphone (optionnel)</Form.Label>
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

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="termsAccepted"
                        label="J'accepte les conditions d'utilisation et la politique de confidentialité"
                        checked={values.termsAccepted}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.termsAccepted && errors.termsAccepted}
                        feedback={errors.termsAccepted}
                        feedbackType="invalid"
                      />
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 mt-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Inscription en cours...' : 'S\'inscrire'}
                    </Button>
                  </Form>
                )}
              </Formik>

              <div className="text-center mt-4">
                <p>
                  Déjà inscrit ?{' '}
                  <a href="/login" className="text-primary">
                    Se connecter
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

export default Register;
