import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

const Login = () => {
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // Schéma de validation avec Yup
  const validationSchema = Yup.object({
    email: Yup.string().email('Email invalide').required('L\'email est requis'),
    password: Yup.string().required('Le mot de passe est requis')
  });

  const twoFactorValidationSchema = Yup.object({
    token: Yup.string().required('Le code d\'authentification est requis').length(6, 'Le code doit contenir 6 chiffres')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      // Appel à l'API pour la connexion
      const response = await axios.post('/api/auth/login', {
        email: values.email,
        password: values.password
      });
      
      // Vérifier si l'utilisateur a activé l'authentification à deux facteurs
      const user = await axios.get('/api/auth/user', {
        headers: {
          'x-auth-token': response.data.token
        }
      });
      
      if (user.data.twoFactorEnabled) {
        // Si 2FA est activé, afficher le formulaire de saisie du code
        setEmail(values.email);
        setShowTwoFactor(true);
      } else {
        // Sinon, stocker le token et rediriger
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Identifiants invalides'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      // Valider le token 2FA
      await axios.post('/api/2fa/validate', {
        email,
        token: values.token
      });
      
      // Reconnecter l'utilisateur
      const response = await axios.post('/api/auth/login', {
        email,
        password: values.password
      });
      
      // Stocker le token et rediriger
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Code d\'authentification invalide'
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
              <h2>Connexion</h2>
              <p className="mb-0">Accédez à votre espace membre</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              {!showTwoFactor ? (
                <Formik
                  initialValues={{
                    email: '',
                    password: '',
                    rememberMe: false
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

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          name="rememberMe"
                          label="Se souvenir de moi"
                          checked={values.rememberMe}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mt-3"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                      </Button>
                    </Form>
                  )}
                </Formik>
              ) : (
                <Formik
                  initialValues={{
                    token: '',
                    password: ''
                  }}
                  validationSchema={twoFactorValidationSchema}
                  onSubmit={handleTwoFactorSubmit}
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
                      <Alert variant="info">
                        Veuillez entrer le code d'authentification à 6 chiffres généré par votre application d'authentification.
                      </Alert>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Code d'authentification</Form.Label>
                        <Form.Control
                          type="text"
                          name="token"
                          value={values.token}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.token && errors.token}
                          maxLength={6}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.token}
                        </Form.Control.Feedback>
                      </Form.Group>

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

                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mt-3"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Vérification en cours...' : 'Vérifier'}
                      </Button>
                      
                      <Button
                        variant="link"
                        className="w-100 mt-2"
                        onClick={() => setShowTwoFactor(false)}
                      >
                        Retour à la connexion
                      </Button>
                    </Form>
                  )}
                </Formik>
              )}

              <div className="text-center mt-4">
                <p>
                  <a href="/forgot-password" className="text-primary">
                    Mot de passe oublié ?
                  </a>
                </p>
                <p>
                  Pas encore de compte ?{' '}
                  <a href="/register" className="text-primary">
                    S'inscrire
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

export default Login;
