import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/adminApi';
import { useAuth } from '../../auth/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const data = await usersApi.getAll(params);
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    if (!isSuperAdmin) {
      alert('Only superadmins can change roles');
      return;
    }
    
    if (userId === currentUser._id) {
      alert('Cannot change your own role');
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.updateRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (userId === currentUser._id) {
      alert('Cannot deactivate your own account');
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.toggleStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.resetPassword(editingUser._id, newPassword);
      setShowPasswordModal(false);
      setEditingUser(null);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!isSuperAdmin) {
      alert('Only superadmins can delete users');
      return;
    }

    if (userId === currentUser._id) {
      alert('Cannot delete your own account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.delete(userId);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superadmin': return 'role-badge superadmin';
      case 'admin': return 'role-badge admin';
      default: return 'role-badge user';
    }
  };

  return (
    <div className="admin-list">
      <div className="list-header">
        <h2>👥 User Management</h2>
      </div>

      <div className="list-filters">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="superadmin">Super Admins</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>{user.name?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{user.name}</div>
                          {user._id === currentUser._id && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-primary)' }}>(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {isSuperAdmin && user._id !== currentUser._id ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="filter-select"
                          style={{ padding: '0.5rem', minWidth: '120px' }}
                          disabled={actionLoading}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      ) : (
                        <span className={getRoleBadgeClass(user.role)}>
                          {user.role === 'superadmin' ? '👑 Super Admin' : 
                           user.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon"
                          title="Reset Password"
                          onClick={() => { setEditingUser(user); setShowPasswordModal(true); }}
                          disabled={actionLoading}
                        >
                          🔑
                        </button>
                        {user._id !== currentUser._id && (
                          <>
                            <button
                              className="btn-icon"
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(user._id, user.isActive)}
                              disabled={actionLoading}
                            >
                              {user.isActive ? '🚫' : '✅'}
                            </button>
                            {isSuperAdmin && (
                              <button
                                className="btn-icon delete"
                                title="Delete User"
                                onClick={() => handleDelete(user._id)}
                                disabled={actionLoading}
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary"
              >
                ← Previous
              </button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Password for {editingUser?.name}</h3>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleResetPassword}
                disabled={actionLoading || newPassword.length < 6}
              >
                {actionLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
