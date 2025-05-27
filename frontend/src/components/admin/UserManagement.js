import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        setLoading(false);
        return;
      }

      // Récupérer tous les utilisateurs (admin seulement)
      const res = await axios.get('/api/users', {
        headers: {
          'x-auth-token': token
        }
      });

      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des utilisateurs'
      );
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour modifier le statut');
        return;
      }

      // Mettre à jour le statut de l'utilisateur
      await axios.put(`/api/users/${userId}`, { status: newStatus }, {
        headers: {
          'x-auth-token': token
        }
      });

      // Mettre à jour l'état local
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));

      setSuccess(`Statut de l'utilisateur mis à jour avec succès`);
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de la mise à jour du statut'
      );
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour modifier le rôle');
        return;
      }

      // Mettre à jour le rôle de l'utilisateur
      await axios.put(`/api/users/${userId}`, { role: newRole }, {
        headers: {
          'x-auth-token': token
        }
      });

      // Mettre à jour l'état local
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));

      setSuccess(`Rôle de l'utilisateur mis à jour avec succès`);
    } catch (err) {
      setError(
        err.response && err.response.data.errors
          ? err.response.data.errors[0].msg
          : 'Une erreur est survenue lors de la mise à jour du rôle'
      );
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Filtrer les utilisateurs en fonction de la recherche et du filtre de statut
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des utilisateurs...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Gestion des Utilisateurs</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="shadow mb-4">
        <Card.Header className="bg-gradient-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Liste des utilisateurs</h4>
            <Button variant="light" size="sm" onClick={fetchUsers}>
              <i className="fas fa-sync-alt me-1"></i> Actualiser
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Form.Group className="mb-0" style={{ width: '300px' }}>
              <Form.Control
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-0" style={{ width: '200px' }}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="Actif">Actif</option>
                <option value="En attente">En attente</option>
                <option value="Expiré">Expiré</option>
              </Form.Select>
            </Form.Group>
          </div>

          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Rôle</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">Aucun utilisateur trouvé</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.status === 'Actif' && <Badge bg="success">Actif</Badge>}
                        {user.status === 'En attente' && <Badge bg="warning">En attente</Badge>}
                        {user.status === 'Expiré' && <Badge bg="danger">Expiré</Badge>}
                      </td>
                      <td>
                        {user.role === 'admin' && <Badge bg="primary">Admin</Badge>}
                        {user.role === 'moderator' && <Badge bg="info">Modérateur</Badge>}
                        {user.role === 'membre' && <Badge bg="secondary">Membre</Badge>}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleUserSelect(user)}
                        >
                          Gérer
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

      {/* Modal de gestion d'utilisateur */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        {selectedUser && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Gestion de l'utilisateur: {selectedUser.firstName} {selectedUser.lastName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Téléphone:</strong> {selectedUser.phoneNumber || 'Non renseigné'}</p>
                  <p><strong>Date d'inscription:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  <p><strong>Dernière connexion:</strong> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Jamais'}</p>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Statut</Form.Label>
                    <Form.Select
                      value={selectedUser.status}
                      onChange={(e) => handleStatusChange(selectedUser._id, e.target.value)}
                    >
                      <option value="Actif">Actif</option>
                      <option value="En attente">En attente</option>
                      <option value="Expiré">Expiré</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Rôle</Form.Label>
                    <Form.Select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(selectedUser._id, e.target.value)}
                    >
                      <option value="membre">Membre</option>
                      <option value="moderator">Modérateur</option>
                      <option value="admin">Administrateur</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <hr />

              <h5>Adresse</h5>
              <p>
                {selectedUser.address?.street ? (
                  <>
                    {selectedUser.address.street}<br />
                    {selectedUser.address.postalCode} {selectedUser.address.city}<br />
                    {selectedUser.address.country}
                  </>
                ) : (
                  'Adresse non renseignée'
                )}
              </p>

              <hr />

              <h5>Sécurité</h5>
              <p><strong>Authentification à deux facteurs:</strong> {selectedUser.twoFactorEnabled ? 'Activée' : 'Désactivée'}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeModal}>
                Fermer
              </Button>
              <Button 
                variant="primary" 
                href={`/admin/users/${selectedUser._id}/edit`}
              >
                Modifier le profil
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default UserManagement;
