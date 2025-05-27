import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ChangePassword = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Schéma de validation avec Yup
  const validationSchema = Yup.object({
    currentPassword: Yup.string().required('Le mot de passe actuel est requis'),
    newPassword: Yup.string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
      .required('Le nouveau mot de passe est requis'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Les mots de passe doivent correspondre')
      .required('La confirmation du mot de passe est requise')
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour modifier votre mot de passe');
        setSubmitting(false);
        return;
      }

      // Récupérer l'ID de l'utilisateur connecté
      const userRes = await axios.get('/api/auth/user', {
        headers: {
          'x-auth-token': token
        }
      });

      const userId = userRes.data._id;

      // Appel à l'API pour changer le mot de passe
      await axios.put(`/api/users/password/${userId}`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      }, {
        headers: {
          'x-auth-token': token
        }
      });

      setSuccess('Mot de passe modifié avec succès');
      resetForm();
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de la modification du mot de passe'
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
            <Card.Header className="bg-gradient-primary text-white">
              <h4 className="mb-0">Changer mon mot de passe</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Formik
                initialValues={{
                  currentPassword: '',
                  newPassword: '',
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
                      <Form.Label>Mot de passe actuel</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={values.currentPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.currentPassword && errors.currentPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.currentPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Nouveau mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={values.newPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.newPassword && errors.newPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.newPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
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

                    <div className="d-flex justify-content-between mt-4">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Modification en cours...' : 'Modifier le mot de passe'}
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

export default ChangePassword;
