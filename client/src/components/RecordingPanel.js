import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import './RecordingPanel.css';

const RecordingPanel = ({ 
  mapInstance, 
  onRecordingChange,
  currentRoadmap = null 
}) => {
  const { getToken, isAuthenticated } = useAuth();
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [journeyId, setJourneyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Stats
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coordinates, setCoordinates] = useState([]);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [speed, setSpeed] = useState(0);
  
  // Refs
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const coordinateBufferRef = useRef([]);
  const lastSyncRef = useRef(Date.now());

  // GPS Sampling interval (3 seconds)
  const GPS_INTERVAL = 3000;
  // Sync to server interval (15 seconds)
  const SYNC_INTERVAL = 15000;

  // Demo Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  const demoIntervalRef = useRef(null);
  const demoPathRef = useRef([]);
  const demoIndexRef = useRef(0);

  // Check for active recording on mount
  useEffect(() => {
    if (isAuthenticated) {
      checkActiveRecording();
    }
    return () => {
      stopWatching();
      stopSimulation();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Notify parent of recording state changes
  useEffect(() => {
    if (onRecordingChange) {
      onRecordingChange({
        isRecording,
        isPaused,
        coordinates,
        distance,
        duration,
      });
    }
  }, [isRecording, isPaused, coordinates, distance, duration, onRecordingChange]);

  const checkActiveRecording = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/journeys/active', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.journey) {
          // Resume active recording
          setJourneyId(data.journey._id);
          setCoordinates(data.journey.coordinates || []);
          setDistance(data.journey.distance || 0);
          const elapsed = (Date.now() - new Date(data.journey.startTime).getTime()) / 1000;
          setDuration(Math.floor(elapsed));
          
          if (data.journey.status === 'recording') {
            setIsRecording(true);
            setIsPaused(false);
            startWatching();
            startTimer();
          } else if (data.journey.status === 'paused') {
            setIsRecording(true);
            setIsPaused(true);
          }
        }
      }
    } catch (err) {
      console.error('Check active recording error:', err);
    }
  };

  const startRecording = async () => {
    if (!isAuthenticated) {
      setError('Please login to record your journey');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get initial position (real or demo)
      let initialCoord;
      
      if (isDemoMode) {
        // Generate demo path
        generateDemoPath();
        const start = demoPathRef.current[0] || { lat: 27.7172, lng: 85.3240 };
        initialCoord = {
          lat: start.lat,
          lng: start.lng,
          altitude: 1300,
          accuracy: 5,
          timestamp: new Date().toISOString(),
        };
      } else {
        const position = await getCurrentPosition();
        initialCoord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
      }

      const token = getToken();
      const response = await fetch('/api/journeys/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapSlug: currentRoadmap?.slug,
          roadmapName: currentRoadmap?.name,
          initialCoordinate: initialCoord,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start recording');
      }

      const data = await response.json();
      setJourneyId(data.journey._id);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setDistance(0);
      setCoordinates([initialCoord]);
      
      if (isDemoMode) {
        startSimulation();
      } else {
        startWatching();
      }
      startTimer();

      // Center map on user position
      if (mapInstance) {
        mapInstance.flyTo([initialCoord.lat, initialCoord.lng], 17);
      }
    } catch (err) {
      console.error('Start recording error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseRecording = async () => {
    if (!journeyId) return;

    try {
      const token = getToken();
      await fetch(`/api/journeys/${journeyId}/pause`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      setIsPaused(true);
      if (isDemoMode) stopSimulation();
      else stopWatching();
      
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      console.error('Pause recording error:', err);
    }
  };

  const resumeRecording = async () => {
    if (!journeyId) return;

    try {
      const token = getToken();
      await fetch(`/api/journeys/${journeyId}/resume`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      setIsPaused(false);
      if (isDemoMode) startSimulation();
      else startWatching();
      
      startTimer();
    } catch (err) {
      console.error('Resume recording error:', err);
    }
  };

  const stopRecording = async () => {
    if (!journeyId) return;

    setIsLoading(true);
    
    try {
      // Sync remaining coordinates
      if (coordinateBufferRef.current.length > 0) {
        await syncCoordinates();
      }

      const token = getToken();
      const response = await fetch(`/api/journeys/${journeyId}/stop`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to stop recording');
      }

      // Show completion message
      if (data.newBadges && data.newBadges.length > 0) {
        const badgeNames = data.newBadges.map(b => `${b.icon} ${b.name}`).join(', ');
        alert(`🎉 Journey completed! New badges earned: ${badgeNames}`);
      } else {
        alert('🎉 Journey completed and saved!');
      }

      resetRecording();
    } catch (err) {
      console.error('Stop recording error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRecording = async () => {
    if (!journeyId) return;

    if (!window.confirm('Are you sure you want to cancel this recording?')) {
      return;
    }

    try {
      const token = getToken();
      await fetch(`/api/journeys/${journeyId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      resetRecording();
    } catch (err) {
      console.error('Cancel recording error:', err);
    }
  };

  const resetRecording = () => {
    stopWatching();
    stopSimulation();
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsRecording(false);
    setIsPaused(false);
    setJourneyId(null);
    setDuration(0);
    setDistance(0);
    setCoordinates([]);
    setGpsAccuracy(null);
    setSpeed(0);
    coordinateBufferRef.current = [];
    demoPathRef.current = [];
    demoIndexRef.current = 0;
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  };

  const startWatching = () => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: GPS_INTERVAL,
      }
    );
  };

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handlePositionUpdate = useCallback((position) => {
    const newCoord = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      altitude: position.coords.altitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
    };

    setGpsAccuracy(position.coords.accuracy);
    setSpeed(position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) : 0); // km/h

    // Add to local coordinates
    setCoordinates(prev => {
      const updated = [...prev, newCoord];
      
      // Calculate distance
      if (updated.length > 1) {
        const totalDist = calculateTotalDistance(updated);
        setDistance(totalDist);
      }
      
      return updated;
    });

    // Buffer for server sync
    coordinateBufferRef.current.push(newCoord);

    // Sync to server periodically
    if (Date.now() - lastSyncRef.current > SYNC_INTERVAL) {
      syncCoordinates();
    }
  }, []);

  const handlePositionError = (error) => {
    console.error('GPS error:', error);
    if (error.code === error.PERMISSION_DENIED) {
      setError('GPS permission denied. Please enable location services.');
    }
  };

  const syncCoordinates = async () => {
    if (!journeyId || coordinateBufferRef.current.length === 0) return;

    try {
      const token = getToken();
      const coordsToSync = [...coordinateBufferRef.current];
      coordinateBufferRef.current = [];
      lastSyncRef.current = Date.now();

      await fetch(`/api/journeys/${journeyId}/track`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coordinates: coordsToSync }),
      });
    } catch (err) {
      console.error('Sync coordinates error:', err);
      // Put coordinates back in buffer on error
      coordinateBufferRef.current.unshift(...coordinateBufferRef.current);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const calculateTotalDistance = (coords) => {
    if (coords.length < 2) return 0;
    
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      total += calculateHaversineDistance(coords[i-1], coords[i]);
    }
    return total;
  };

  const calculateHaversineDistance = (coord1, coord2) => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = coord1.lat * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    const deltaLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const deltaLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Simulation Logic
  const generateDemoPath = () => {
    let points = [];
    
    if (currentRoadmap && currentRoadmap.stops && currentRoadmap.stops.length > 0) {
      // Use roadmap stops
      points = currentRoadmap.stops.map(s => {
        if (s.coordinates && s.coordinates.length === 2) {
          return { lat: s.coordinates[0], lng: s.coordinates[1] };
        }
        return null;
      }).filter(p => p);
    }

    // Fallback if no roadmap points
    if (points.length === 0) {
      // Default loop around Kathmandu Durbar Square
      points = [
        { lat: 27.7042, lng: 85.3067 },
        { lat: 27.7050, lng: 85.3075 },
        { lat: 27.7060, lng: 85.3080 },
        { lat: 27.7055, lng: 85.3090 },
        { lat: 27.7045, lng: 85.3085 },
        { lat: 27.7042, lng: 85.3067 }
      ];
    }

    // Interpolate points to create a smooth path (approx 1 point per second at walking speed)
    const interpolated = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i+1];
      const dist = calculateHaversineDistance(start, end);
      const steps = Math.max(10, Math.floor(dist / 5)); // 5 meters per step
      
      for (let j = 0; j < steps; j++) {
        const fraction = j / steps;
        interpolated.push({
          lat: start.lat + (end.lat - start.lat) * fraction,
          lng: start.lng + (end.lng - start.lng) * fraction
        });
      }
    }
    interpolated.push(points[points.length - 1]);
    
    demoPathRef.current = interpolated;
    demoIndexRef.current = 0;
  };

  const startSimulation = () => {
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    
    demoIntervalRef.current = setInterval(() => {
      if (demoIndexRef.current >= demoPathRef.current.length) {
        // Loop or stop? Let's loop for continuous testing
        demoIndexRef.current = 0;
      }

      const coord = demoPathRef.current[demoIndexRef.current];
      
      handlePositionUpdate({
        coords: {
          latitude: coord.lat,
          longitude: coord.lng,
          altitude: 1300 + Math.random() * 10,
          accuracy: 5,
          speed: 5 + Math.random() // Vary speed slightly
        },
        timestamp: Date.now()
      });

      demoIndexRef.current++;
      
      // Update map center occasionally
      if (mapInstance && demoIndexRef.current % 5 === 0) {
        mapInstance.panTo([coord.lat, coord.lng]);
      }
    }, 1000);
  };

  const stopSimulation = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`recording-panel ${isRecording ? 'active' : ''} ${isPaused ? 'paused' : ''}`}>
      {error && (
        <div className="recording-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {!isRecording ? (
        <div className="start-recording-container">
          <button 
            className="start-recording-btn"
            onClick={startRecording}
            disabled={isLoading}
          >
            <span className="record-icon">●</span>
            <span>{isLoading ? 'Starting...' : 'Start Recording'}</span>
          </button>
          
          <div className="demo-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={isDemoMode} 
                onChange={(e) => setIsDemoMode(e.target.checked)} 
              />
              <span className="demo-label">Demo Mode</span>
            </label>
          </div>
        </div>
      ) : (
        // Recording Controls
        <div className="recording-controls">
          {isDemoMode && <div className="demo-badge">DEMO MODE</div>}
          {/* Stats Display */}
          <div className="recording-stats">
            <div className={`stat-item duration ${isPaused ? 'paused' : ''}`}>
              <span className="stat-value">{formatDuration(duration)}</span>
              <span className="stat-label">Duration</span>
            </div>
            <div className="stat-item distance">
              <span className="stat-value">{formatDistance(distance)}</span>
              <span className="stat-label">Distance</span>
            </div>
            <div className="stat-item speed">
              <span className="stat-value">{speed}</span>
              <span className="stat-label">km/h</span>
            </div>
          </div>

          {/* GPS Accuracy Indicator */}
          {gpsAccuracy && (
            <div className={`gps-accuracy ${gpsAccuracy < 10 ? 'good' : gpsAccuracy < 30 ? 'fair' : 'poor'}`}>
              <span className="gps-dot"></span>
              <span>GPS: {Math.round(gpsAccuracy)}m</span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="control-buttons">
            {isPaused ? (
              <button 
                className="control-btn resume"
                onClick={resumeRecording}
              >
                ▶ Resume
              </button>
            ) : (
              <button 
                className="control-btn pause"
                onClick={pauseRecording}
              >
                ⏸ Pause
              </button>
            )}
            
            <button 
              className="control-btn stop"
              onClick={stopRecording}
              disabled={isLoading || duration < 30}
            >
              {isLoading ? '...' : '⏹ Stop'}
            </button>

            <button 
              className="control-btn cancel"
              onClick={cancelRecording}
            >
              ✕
            </button>
          </div>

          {duration < 30 && (
            <div className="min-time-notice">
              Min 30s required ({30 - duration}s left)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingPanel;
