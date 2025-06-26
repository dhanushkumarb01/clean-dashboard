import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/grandadmin-dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/auth` : 'https://clean-dashboard.onrender.com/api/auth';

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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">User Management</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow"
            onClick={() => navigate('/dashboard')}
          >
            <i className="bi bi-grid"></i> Dashboard
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-pink-50 rounded-xl p-6 flex flex-col items-start shadow">
          <div className="flex items-center mb-2">
            <span className="text-pink-500 text-2xl mr-2"><i className="bi bi-shield-lock"></i></span>
            <span className="text-lg font-semibold text-pink-700">Grand Admins</span>
          </div>
          <div className="text-3xl font-bold text-pink-700">{grandAdmins.length}</div>
          <div className="text-sm text-pink-600 mt-1">Full access</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-start shadow">
          <div className="flex items-center mb-2">
            <span className="text-purple-500 text-2xl mr-2"><i className="bi bi-shield-check"></i></span>
            <span className="text-lg font-semibold text-purple-700">Super Admins</span>
          </div>
          <div className="text-3xl font-bold text-purple-700">{roleCounts.superadmin}</div>
          <div className="text-sm text-purple-600 mt-1">High-level access</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-start shadow">
          <div className="flex items-center mb-2">
            <span className="text-blue-500 text-2xl mr-2"><i className="bi bi-people"></i></span>
            <span className="text-lg font-semibold text-blue-700">Admins</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">{roleCounts.admin}</div>
          <div className="text-sm text-blue-600 mt-1">Standard access</div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 flex flex-col items-start shadow">
          <div className="flex items-center mb-2">
            <span className="text-green-500 text-2xl mr-2"><i className="bi bi-people"></i></span>
            <span className="text-lg font-semibold text-green-700">Users</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{roleCounts.user}</div>
          <div className="text-sm text-green-600 mt-1">Basic access</div>
        </div>
      </div>
      {/* User Management Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2 md:mb-0">User Management</h2>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow"
            onClick={openAddModal}
          >
            + Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center text-red-500 py-4">{error}</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-gray-400 py-4">No users found</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{user.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{user.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">{user.role || 'User'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{user.emailVerified ? 'Active' : 'Pending'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-600" onClick={() => openEditModal(user)} title="Edit"><i className="bi bi-pencil"></i></button>
                      <button className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-red-600" onClick={() => handleDeleteUser(user._id)} title="Delete"><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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