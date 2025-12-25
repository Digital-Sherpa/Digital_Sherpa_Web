import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { createBooking } from '../services/api';

const BookingModal = ({ place, craftsman, onClose, onSuccess }) => {
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    workshopType: 'halfDay',
    bookingDate: '',
    numberOfPeople: 1,
    notes: '',
  });

  // Get price based on workshop type
  const getPrice = () => {
    if (craftsman && craftsman.workshopTypes?.length > 0) {
      const selected = craftsman.workshopTypes.find(w => w.type === formData.workshopType);
      return selected?.price || 0;
    }
    if (place?.workshopPrice) {
      return formData.workshopType === 'halfDay' 
        ? place.workshopPrice.halfDay || 0
        : place.workshopPrice.fullDay || 0;
    }
    return 0;
  };

  const getTotalPrice = () => {
    return getPrice() * formData.numberOfPeople;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfPeople' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to book a workshop');
        setLoading(false);
        return;
      }

      const bookingData = {
        bookingType: craftsman ? 'craftsman' : 'workshop',
        placeSlug: place?.slug,
        placeName: place?.name,
        craftsmanId: craftsman?._id,
        craftsmanName: craftsman?.name,
        workshopType: formData.workshopType === 'halfDay' ? 'Half Day' : 'Full Day',
        bookingDate: formData.bookingDate,
        duration: formData.workshopType === 'halfDay' ? '3-4 hours' : 'Full Day',
        numberOfPeople: formData.numberOfPeople,
        totalPrice: getTotalPrice(),
        notes: formData.notes,
      };

      await createBooking(bookingData, token);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!user) {
    return (
      <div className="booking-modal-overlay" onClick={onClose}>
        <div className="booking-modal" onClick={e => e.stopPropagation()}>
          <button className="booking-modal-close" onClick={onClose}>✕</button>
          <div className="booking-login-prompt">
            <span className="login-icon">🔐</span>
            <h3>Login Required</h3>
            <p>Please log in to book a workshop experience.</p>
            <button className="booking-login-btn" onClick={() => window.location.href = '/login'}>
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="booking-modal-overlay" onClick={onClose}>
        <div className="booking-modal" onClick={e => e.stopPropagation()}>
          <div className="booking-success">
            <span className="success-icon">✅</span>
            <h3>Booking Confirmed!</h3>
            <p>Your workshop has been booked successfully.</p>
            <p className="success-note">View your bookings in your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        <button className="booking-modal-close" onClick={onClose}>✕</button>
        
        <div className="booking-modal-header">
          <h2>📅 Book Workshop</h2>
          <p className="booking-place-name">
            {craftsman ? craftsman.name : place?.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="booking-error">{error}</div>}

          <div className="booking-form-group">
            <label>Workshop Type</label>
            <select 
              name="workshopType" 
              value={formData.workshopType}
              onChange={handleChange}
              required
            >
              <option value="halfDay">Half Day (3-4 hours) - Rs. {place?.workshopPrice?.halfDay || 0}</option>
              <option value="fullDay">Full Day - Rs. {place?.workshopPrice?.fullDay || 0}</option>
            </select>
          </div>

          <div className="booking-form-group">
            <label>Booking Date</label>
            <input
              type="date"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleChange}
              min={getMinDate()}
              required
            />
          </div>

          <div className="booking-form-group">
            <label>Number of People</label>
            <input
              type="number"
              name="numberOfPeople"
              value={formData.numberOfPeople}
              onChange={handleChange}
              min="1"
              max="10"
              required
            />
          </div>

          <div className="booking-form-group">
            <label>Special Requests (Optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requirements..."
              rows="3"
            />
          </div>

          <div className="booking-summary">
            <div className="summary-row">
              <span>Price per person:</span>
              <span>Rs. {getPrice()}</span>
            </div>
            <div className="summary-row">
              <span>People:</span>
              <span>× {formData.numberOfPeople}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>Rs. {getTotalPrice()}</span>
            </div>
          </div>

          <div className="booking-note">
            <span>ℹ️</span>
            <p>Free cancellation up to 7 days before the booking date.</p>
          </div>

          <button 
            type="submit" 
            className="booking-submit-btn"
            disabled={loading || !formData.bookingDate}
          >
            {loading ? 'Booking...' : `Confirm Booking - Rs. ${getTotalPrice()}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
