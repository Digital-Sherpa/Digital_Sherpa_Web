import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlaceList from './components/PlaceList';
import CraftsmanList from './components/CraftsmanList';
import RoadmapList from './components/RoadmapList';
import './admin.css';

const AdminApp = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'places', 'craftsmen', 'roadmaps'].includes(hash)) {
        setActiveSection(hash);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when section changes
  const handleSectionChange = (section) => {
    setActiveSection(section);
    window.location.hash = section;
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-app">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange} 
      />
      <main className="admin-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminApp;
