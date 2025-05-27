import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Modal, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { Formik } from 'formik';
import * as Yup from 'yup';

const CodeBatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchCodes, setBatchCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        setLoading(false);
        return;
      }

      // Récupérer tous les lots de codes
      const res = await axios.get('/api/codes/batches', {
        headers: {
          'x-auth-token': token
        }
      });

      setBatches(res.data);
      setLoading(false);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des lots de codes'
      );
      setLoading(false);
    }
  };

  const handleViewCodes = async (batch) => {
    try {
      setLoadingCodes(true);
      setSelectedBatch(batch);
      setShowCodesModal(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        setLoadingCodes(false);
        return;
      }

      // Récupérer tous les codes du lot
      const res = await axios.get(`/api/codes/batch/${batch._id}`, {
        headers: {
          'x-auth-token': token
        }
      });

      setBatchCodes(res.data);
      setLoadingCodes(false);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des codes'
      );
      setLoadingCodes(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce lot de codes ? Cette action est irréversible.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour effectuer cette action');
        return;
      }

      // Supprimer le lot de codes
      await axios.delete(`/api/codes/batch/${batchId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      // Mettre à jour la liste des lots
      setBatches(batches.filter(batch => batch._id !== batchId));
      setSuccess('Lot de codes supprimé avec succès');
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la suppression du lot de codes'
      );
    }
  };

  // Schéma de validation pour l'importation de codes
  const importValidationSchema = Yup.object({
    name: Yup.string().required('Le nom du lot est requis'),
    description: Yup.string(),
    expiryDate: Yup.date().required('La date d\'expiration est requise').min(new Date(), 'La date d\'expiration doit être dans le futur'),
    file: Yup.mixed().required('Un fichier Excel est requis')
  });

  const handleImportSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour importer des codes');
        setSubmitting(false);
        return;
      }

      // Créer un FormData pour l'upload de fichier
      const formData = new FormData();
      formData.append('file', values.file);
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('expiryDate', values.expiryDate);

      // Importer les codes
      const res = await axios.post('/api/codes/import', formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Fermer le modal et réinitialiser le formulaire
      setShowImportModal(false);
      resetForm();

      // Mettre à jour la liste des lots
      fetchBatches();

      setSuccess(`${res.data.totalCodes} codes importés avec succès`);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de l\'importation des codes'
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
          <p className="mt-2">Chargement des lots de codes...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Gestion des Lots de Codes</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex justify-content-end mb-4">
        <Button 
          variant="primary" 
          onClick={() => setShowImportModal(true)}
        >
          <i className="fas fa-file-import me-2"></i>
          Importer des codes
        </Button>
      </div>

      <Card className="shadow">
        <Card.Header className="bg-gradient-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Liste des lots de codes</h4>
            <Button variant="light" size="sm" onClick={fetchBatches}>
              <i className="fas fa-sync-alt me-1"></i> Actualiser
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {batches.length === 0 ? (
            <div className="text-center py-4">
              <p>Aucun lot de codes n'a été importé.</p>
              <Button 
                variant="outline-primary" 
                onClick={() => setShowImportModal(true)}
              >
                Importer votre premier lot de codes
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Date d'importation</th>
                    <th>Date d'expiration</th>
                    <th>Codes</th>
                    <th>Importé par</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(batch => (
                    <tr key={batch._id}>
                      <td>{batch.name}</td>
                      <td>{batch.description || '-'}</td>
                      <td>{new Date(batch.importedAt).toLocaleDateString()}</td>
                      <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                      <td>
                        {batch.assignedCodes} / {batch.totalCodes}
                        <div className="progress mt-1" style={{ height: '5px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ width: `${(batch.assignedCodes / batch.totalCodes) * 100}%` }}
                            aria-valuenow={(batch.assignedCodes / batch.totalCodes) * 100}
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </td>
                      <td>{batch.importedBy ? `${batch.importedBy.firstName} ${batch.importedBy.lastName}` : '-'}</td>
                      <td>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewCodes(batch)}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDeleteBatch(batch._id)}
                        >
                          <i className="fas fa-trash"></i>
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

      {/* Modal d'importation de codes */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Importer des codes d'accès</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            name: '',
            description: '',
            expiryDate: '',
            file: null
          }}
          validationSchema={importValidationSchema}
          onSubmit={handleImportSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
            setFieldValue
          }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <p>
                  Importez des codes d'accès depuis un fichier Excel. Le fichier doit contenir une colonne nommée "code" avec les codes d'accès.
                </p>

                <Form.Group className="mb-3">
                  <Form.Label>Nom du lot *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.name && errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.description && errors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date d'expiration *</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiryDate"
                    value={values.expiryDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.expiryDate && errors.expiryDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.expiryDate}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Fichier Excel *</Form.Label>
                  <Form.Control
                    type="file"
                    name="file"
                    onChange={(e) => {
                      setFieldValue('file', e.currentTarget.files[0]);
                    }}
                    onBlur={handleBlur}
                    isInvalid={touched.file && errors.file}
                    accept=".xlsx,.xls"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.file}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Formats acceptés: .xlsx, .xls
                  </Form.Text>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowImportModal(false)}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Importation en cours...' : 'Importer'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Modal d'affichage des codes */}
      <Modal show={showCodesModal} onHide={() => setShowCodesModal(false)} size="lg">
        {selectedBatch && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Codes du lot: {selectedBatch.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {loadingCodes ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Chargement des codes...</p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <p className="mb-0"><strong>Total:</strong> {batchCodes.length} codes</p>
                      <p className="mb-0"><strong>Attribués:</strong> {batchCodes.filter(code => code.assignedTo).length} codes</p>
                      <p className="mb-0"><strong>Disponibles:</strong> {batchCodes.filter(code => !code.assignedTo).length} codes</p>
                    </div>
                    <div>
                      <p className="mb-0"><strong>Date d'expiration:</strong> {new Date(selectedBatch.expiryDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Code</th>
                          <th>Attribué à</th>
                          <th>Date d'attribution</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchCodes.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center">Aucun code dans ce lot</td>
                          </tr>
                        ) : (
                          batchCodes.map((code, index) => (
                            <tr key={code._id}>
                              <td>{index + 1}</td>
                              <td>
                                <code>{code.code}</code>
                              </td>
                              <td>
                                {code.assignedTo ? (
                                  code.assignedTo.firstName && code.assignedTo.lastName ? 
                                  `${code.assignedTo.firstName} ${code.assignedTo.lastName}` : 
                                  code.assignedTo.email
                                ) : (
                                  <span className="text-muted">Non attribué</span>
                                )}
                              </td>
                              <td>
                                {code.assignedAt ? new Date(code.assignedAt).toLocaleDateString() : '-'}
                              </td>
                              <td>
                                {code.isUsed ? (
                                  <span className="badge bg-secondary">Utilisé</span>
                                ) : code.assignedTo ? (
                                  <span className="badge bg-success">Attribué</span>
                                ) : (
                                  <span className="badge bg-primary">Disponible</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCodesModal(false)}>
                Fermer
              </Button>
              <Button 
                variant="primary" 
                href={`/admin/codes/assign/${selectedBatch._id}`}
              >
                Attribuer des codes
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default CodeBatchManagement;
