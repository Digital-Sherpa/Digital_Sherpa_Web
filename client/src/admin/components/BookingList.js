import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../services/adminApi';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;

      const data = await bookingsApi.getAll(params);
      setBookings(data.bookings);
      setPagination(data.pagination);
      
      const statsData = await bookingsApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const confirmation = window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`);
    if (!confirmation) return;

    try {
      let reason = '';
      if (newStatus === 'cancelled') {
        reason = prompt('Enter cancellation reason:') || 'Cancelled by admin';
      }

      await bookingsApi.updateStatus(id, newStatus, reason);
      fetchBookings();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;
    
    try {
      await bookingsApi.delete(id);
      fetchBookings();
    } catch (error) {
      alert('Failed to delete booking: ' + error.message);
    }
  };

  return (
    <div className="admin-list-container">
      <div className="list-header">
        <h2>Booking Management</h2>
        
        {stats && (
          <div className="quick-stats-row" style={{ display: 'flex', gap: '1rem' }}>
             <div className="stat-card-mini">
               <span className="label">Total</span>
               <span className="value">{stats.total}</span>
             </div>
             <div className="stat-card-mini pending">
               <span className="label">Pending</span>
               <span className="value">{stats.pending}</span>
             </div>
             <div className="stat-card-mini confirmed">
               <span className="label">Confirmed</span>
               <span className="value">{stats.confirmed}</span>
             </div>
             <div className="stat-card-mini cancelled">
               <span className="label">Cancelled</span>
               <span className="value">{stats.cancelled}</span>
             </div>
          </div>
        )}
      </div>

      <div className="list-controls">
        <div className="list-tabs">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`list-tab ${filter === status ? 'active' : ''}`}
              onClick={() => { setFilter(status); setPage(1); }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: filter === status ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: filter === status ? '#10b981' : '#9ca3af',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-state" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading bookings...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Experience</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? (
                bookings.map(booking => (
                  <tr key={booking._id} className={booking.status === 'cancelled' ? 'row-dimmed' : ''}>
                    <td>
                      <span className="id-badge" style={{ fontFamily: 'monospace', background: '#1a1f2e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        #{booking._id.substring(booking._id.length - 6)}
                      </span>
                    </td>
                    <td>
                      <div className="user-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="user-name" style={{ fontWeight: '500', color: '#fff' }}>{booking.userId?.name || 'Unknown User'}</span>
                        <span className="user-email" style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{booking.userId?.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="booking-place-details">
                        <div style={{ fontWeight: '500', marginBottom: '2px' }}>{booking.placeName || booking.craftsmanName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`type-badge ${booking.bookingType === 'workshop' ? 'workshop' : ''}`}>
                            {booking.bookingType === 'workshop' ? '🎨 Workshop' : '👤 Craftsman'}
                          </span>
                          {booking.workshopType && <span>• {booking.workshopType}</span>}
                        </div>
                        {booking.numberOfPeople > 1 && (
                           <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#10b981' }}>
                             👥 {booking.numberOfPeople} People
                           </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                         <div style={{ color: '#fff' }}>{new Date(booking.bookingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                         <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{booking.duration || 'Full Day'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="price-cell" style={{ fontWeight: '600', color: '#fff' }}>
                        Rs. {booking.totalPrice?.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ gap: '0.5rem' }}>
                        {booking.status === 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                            className="btn-icon" 
                            title="Confirm Booking"
                            style={{ color: '#10b981' }}
                          >
                            ✓
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            onClick={() => handleStatusUpdate(booking._id, 'completed')}
                            className="btn-icon" 
                            title="Mark Completed"
                            style={{ color: '#3b82f6' }}
                          >
                            🏁
                          </button>
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <button 
                            onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                            className="btn-icon" 
                            title="Cancel Booking"
                            style={{ color: '#ef4444' }}
                          >
                            🚫
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(booking._id)}
                          className="btn-icon" 
                          title="Delete Record"
                          style={{ color: '#ef4444', opacity: 0.7 }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center" style={{ padding: '3rem', color: '#6b7280' }}>
                    No bookings found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button 
            className="btn-secondary"
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            ← Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
            Page {page} of {pagination.pages}
          </span>
          <button 
            className="btn-secondary"
            disabled={page === pagination.pages} 
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingList;
