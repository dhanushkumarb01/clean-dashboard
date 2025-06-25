import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/grandadmin-dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_URL = '/api/auth';

const GrandAdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [grandAdmins, setGrandAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'USER' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchGrandAdmins();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/grandadmin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch grandadmins count
  const fetchGrandAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/grandadmin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGrandAdmins(data.grandadmins);
      }
    } catch {}
  };

  // Stats
  const roleCounts = users.reduce((acc, user) => {
    const role = (user.role || 'user').toLowerCase();
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, { grandadmin: 0, superadmin: 0, admin: 0, user: 0 });

  // Modal handlers
  const openAddModal = () => {
    setModalMode('add');
    setForm({ name: '', email: '', phone: '', password: '', role: 'USER' });
    setShowModal(true);
  };
  const openEditModal = (user) => {
    setModalMode('edit');
    setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', password: '', role: user.role || 'USER', id: user._id });
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setModalUser(null);
    setForm({ name: '', email: '', phone: '', password: '', role: 'USER' });
  };

  // Save user (add or edit)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('authToken');
    try {
      const url = modalMode === 'edit' ? `${API_URL}/grandadmin/update-user/${form.id}` : `${API_URL}/grandadmin/assign-role`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      const body = JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        ...(modalMode === 'add' && { password: form.password })
      });
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body
      });
      const data = await res.json();
      if (data.success) {
        closeModal();
        fetchUsers();
      } else {
        alert(data.message || 'Failed to save user');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${API_URL}/grandadmin/delete-user/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    const term = search.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.phone || '').toLowerCase().includes(term)
    );
  });

  // Helper for role badge
  const getRoleBadgeClass = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'grandadmin': return 'role-badge role-grandadmin';
      case 'superadmin': return 'role-badge role-superadmin';
      case 'admin': return 'role-badge role-admin';
      default: return 'role-badge role-user';
    }
  };

  // Helper for status badge
  const getStatusBadgeClass = (verified) =>
    'status-badge ' + (verified ? 'status-active' : 'status-pending');

  return (
    <div className="main-content">
      <div className="dashboard-container">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="container-fluid">
            <h5 className="navbar-brand mb-0">
              <i className="bi bi-shield-lock me-2"></i>
              Grand Admin Dashboard
            </h5>
            <div className="d-flex align-items-center">
              <div className="search-container me-3" style={{ maxWidth: 300 }}>
                <i className="bi bi-search"></i>
                <input type="text" className="form-control" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="btn btn-outline-primary me-2" onClick={() => navigate('/dashboard')}>
                <i className="bi bi-grid me-1"></i> Dashboard
              </button>
              <div className="dropdown">
                <a href="#" className="d-flex align-items-center text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
                  <div className="user-avatar">
                    <i className="bi bi-person"></i>
                  </div>
                  <span className="ms-2 d-none d-md-inline fw-semibold">Grand Admin</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="/" target="_blank"><i className="bi bi-house me-2"></i>Main App</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item text-danger" href="#" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
        {/* Stats Cards */}
        <div className="container-fluid">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card stat-card grandadmin h-100 border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)' }}>
                      <i className="bi bi-shield-lock" style={{ color: '#e91e63' }}></i>
                    </div>
                    <div>
                      <div className="stat-label">Grand Admins</div>
                      <div className="stat-number" id="grandadminCount">{grandAdmins.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card stat-card superadmin h-100 border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                      <i className="bi bi-shield-check" style={{ color: '#9c27b0' }}></i>
                    </div>
                    <div>
                      <div className="stat-label">Super Admins</div>
                      <div className="stat-number" id="superadminCount">{roleCounts.superadmin}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card stat-card admin h-100 border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
                      <i className="bi bi-shield" style={{ color: '#4caf50' }}></i>
                    </div>
                    <div>
                      <div className="stat-label">Admins</div>
                      <div className="stat-number" id="adminCount">{roleCounts.admin}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card stat-card user h-100 border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                      <i className="bi bi-people" style={{ color: '#2196f3' }}></i>
                    </div>
                    <div>
                      <div className="stat-label">Users</div>
                      <div className="stat-number" id="userCount">{roleCounts.user}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card border-0">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-white">
                <i className="bi bi-people me-2"></i>
                User Management
              </h6>
              <button className="btn btn-lg btn-outline-primary bg-white text-primary border-primary d-flex align-items-center gap-2" onClick={openAddModal} style={{ fontWeight: 600, fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(102,126,234,0.15)' }}>
                <i className="bi bi-person-plus-fill"></i> Add User
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="usersTableBody">
                    {loading ? (
                      <tr><td colSpan="7" className="text-center">Loading...</td></tr>
                    ) : error ? (
                      <tr><td colSpan="7" className="text-danger text-center">{error}</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-muted">No users found</td></tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                              <div><div className="fw-semibold">{user.name || 'N/A'}</div></div>
                            </div>
                          </td>
                          <td>{user.email || 'N/A'}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td><span className={getRoleBadgeClass(user.role)}>{user.role || 'User'}</span></td>
                          <td><span className={getStatusBadgeClass(user.emailVerified)}>{user.emailVerified ? 'Verified' : 'Pending'}</span></td>
                          <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm action-btn btn-edit" onClick={() => openEditModal(user)} title="Edit"><i className="bi bi-pencil"></i></button>
                              <button className="btn btn-sm action-btn btn-delete" onClick={() => handleDeleteUser(user._id)} title="Delete"><i className="bi bi-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === 'edit' ? 'Edit User' : 'Add New User'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                  </div>
                  {modalMode === 'add' && (
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPERADMIN">Super Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrandAdminDashboard; 