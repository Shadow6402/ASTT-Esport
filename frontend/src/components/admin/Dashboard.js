import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Badge } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import axios from 'axios';

// Enregistrer les composants ChartJS nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, pending: 0, expired: 0 },
    memberships: { total: 0, active: 0, expiring: 0, expired: 0 },
    codes: { total: 0, assigned: 0, available: 0, used: 0 }
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [expiringMemberships, setExpiringMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        setLoading(false);
        return;
      }

      // Récupérer les statistiques
      const statsRes = await axios.get('/api/dashboard/stats', {
        headers: {
          'x-auth-token': token
        }
      });

      // Récupérer les utilisateurs récents
      const recentUsersRes = await axios.get('/api/dashboard/recent-users', {
        headers: {
          'x-auth-token': token
        }
      });

      // Récupérer les adhésions qui expirent bientôt
      const expiringMembershipsRes = await axios.get('/api/memberships/expiring', {
        headers: {
          'x-auth-token': token
        }
      });

      setStats(statsRes.data);
      setRecentUsers(recentUsersRes.data);
      setExpiringMemberships(expiringMembershipsRes.data);
      setLoading(false);
    } catch (err) {
      setError(
        err.response && err.response.data.msg
          ? err.response.data.msg
          : 'Erreur lors de la récupération des données du tableau de bord'
      );
      setLoading(false);
    }
  };

  // Données pour le graphique des utilisateurs
  const usersChartData = {
    labels: ['Actifs', 'En attente', 'Expirés'],
    datasets: [
      {
        data: [stats.users.active, stats.users.pending, stats.users.expired],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        borderColor: ['#1e7e34', '#d39e00', '#bd2130'],
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique des codes
  const codesChartData = {
    labels: ['Attribués', 'Disponibles', 'Utilisés'],
    datasets: [
      {
        data: [stats.codes.assigned, stats.codes.available, stats.codes.used],
        backgroundColor: ['#17a2b8', '#28a745', '#6c757d'],
        borderColor: ['#138496', '#1e7e34', '#5a6268'],
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique des adhésions par mois
  const membershipsByMonthData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Nouvelles adhésions',
        data: stats.memberships.byMonth || Array(12).fill(0),
        backgroundColor: 'rgba(255, 107, 0, 0.6)',
        borderColor: 'rgba(255, 107, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  const membershipsByMonthOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Adhésions par mois',
      },
    },
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement du tableau de bord...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Tableau de Bord Administrateur</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Cartes de statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total des membres</h6>
                  <h3 className="mb-0">{stats.users.total}</h3>
                </div>
                <div className="icon-shape bg-gradient-primary text-white rounded-circle shadow">
                  <i className="fas fa-users"></i>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-success me-2">
                  <i className="fas fa-arrow-up"></i> {stats.users.active}
                </span>
                <span className="text-nowrap">membres actifs</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Adhésions actives</h6>
                  <h3 className="mb-0">{stats.memberships.active}</h3>
                </div>
                <div className="icon-shape bg-gradient-success text-white rounded-circle shadow">
                  <i className="fas fa-id-card"></i>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-warning me-2">
                  <i className="fas fa-clock"></i> {stats.memberships.expiring}
                </span>
                <span className="text-nowrap">expirent bientôt</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Codes d'accès</h6>
                  <h3 className="mb-0">{stats.codes.total}</h3>
                </div>
                <div className="icon-shape bg-gradient-info text-white rounded-circle shadow">
                  <i className="fas fa-key"></i>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-success me-2">
                  <i className="fas fa-check-circle"></i> {stats.codes.available}
                </span>
                <span className="text-nowrap">codes disponibles</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Taux d'utilisation</h6>
                  <h3 className="mb-0">
                    {stats.codes.total > 0
                      ? Math.round((stats.codes.assigned / stats.codes.total) * 100)
                      : 0}%
                  </h3>
                </div>
                <div className="icon-shape bg-gradient-warning text-white rounded-circle shadow">
                  <i className="fas fa-chart-pie"></i>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-info me-2">
                  <i className="fas fa-user-check"></i> {stats.codes.assigned}
                </span>
                <span className="text-nowrap">codes attribués</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Graphiques */}
      <Row className="mb-4">
        <Col lg={4}>
          <Card className="shadow h-100">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Répartition des membres</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container" style={{ position: 'relative', height: '250px' }}>
                <Pie data={usersChartData} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow h-100">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Répartition des codes</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container" style={{ position: 'relative', height: '250px' }}>
                <Pie data={codesChartData} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow h-100">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Adhésions par mois</h5>
            </Card.Header>
            <Card.Body>
              <div className="chart-container" style={{ position: 'relative', height: '250px' }}>
                <Bar data={membershipsByMonthData} options={membershipsByMonthOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tableaux de données */}
      <Row>
        <Col lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="bg-transparent">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Nouveaux membres</h5>
                <Button variant="outline-primary" size="sm" href="/admin/users">
                  Voir tous
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover size="sm">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Date d'inscription</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center">Aucun membre récent</td>
                      </tr>
                    ) : (
                      recentUsers.map(user => (
                        <tr key={user._id}>
                          <td>{user.firstName} {user.lastName}</td>
                          <td>{user.email}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            {user.status === 'Actif' && <Badge bg="success">Actif</Badge>}
                            {user.status === 'En attente' && <Badge bg="warning">En attente</Badge>}
                            {user.status === 'Expiré' && <Badge bg="danger">Expiré</Badge>}
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
        <Col lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="bg-transparent">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Adhésions expirant bientôt</h5>
                <Button variant="outline-primary" size="sm" href="/admin/memberships">
                  Voir toutes
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover size="sm">
                  <thead>
                    <tr>
                      <th>Membre</th>
                      <th>Type</th>
                      <th>Date d'expiration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringMemberships.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center">Aucune adhésion n'expire prochainement</td>
                      </tr>
                    ) : (
                      expiringMemberships.map(membership => (
                        <tr key={membership._id}>
                          <td>
                            {membership.user ? (
                              <>
                                {membership.user.firstName} {membership.user.lastName}
                              </>
                            ) : (
                              <span className="text-muted">Utilisateur supprimé</span>
                            )}
                          </td>
                          <td>{membership.membershipType}</td>
                          <td>{new Date(membership.endDate).toLocaleDateString()}</td>
                          <td>
                            <Button 
                              variant="primary" 
                              size="sm"
                              href={`/admin/memberships/renew/${membership._id}`}
                            >
                              Renouveler
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

      {/* Actions rapides */}
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Actions rapides</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="primary" href="/admin/users/create">
                  <i className="fas fa-user-plus me-2"></i>
                  Ajouter un membre
                </Button>
                <Button variant="success" href="/admin/memberships/create">
                  <i className="fas fa-id-card me-2"></i>
                  Créer une adhésion
                </Button>
                <Button variant="info" href="/admin/codes/import">
                  <i className="fas fa-file-import me-2"></i>
                  Importer des codes
                </Button>
                <Button variant="warning" href="/admin/codes/assign">
                  <i className="fas fa-key me-2"></i>
                  Attribuer des codes
                </Button>
                <Button variant="secondary" href="/admin/memberships/notify-expiring">
                  <i className="fas fa-bell me-2"></i>
                  Notifier les expirations
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
