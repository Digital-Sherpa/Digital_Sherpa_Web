import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlaceList from './components/PlaceList';
import CraftsmanList from './components/CraftsmanList';
import RoadmapList from './components/RoadmapList';
import EventList from './components/EventList';
import UserManagement from './components/UserManagement';
import BookingList from './components/BookingList';
import './admin.css';

const AdminApp = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'places', 'craftsmen', 'roadmaps', 'events', 'users', 'bookings'].includes(hash)) {
        setActiveSection(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'places':
        return <PlaceList />;
      case 'craftsmen':
        return <CraftsmanList />;
      case 'roadmaps':
        return <RoadmapList />;
      case 'events':
        return <EventList />;
      case 'users':
        return <UserManagement />;
      case 'bookings':
        return <BookingList />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // This shouldn't happen due to AdminRoute protection, but just in case
  if (!user || !isAdmin) {
    navigate('/login', { state: { from: { pathname: '/admin' } } });
    return null;
  }

  return (
    <div className="admin-app">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        user={user}
        onLogout={handleLogout}
      />
      <main className="admin-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminApp;
