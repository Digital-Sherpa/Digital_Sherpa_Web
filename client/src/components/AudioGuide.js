import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AudioGuide.css';

// Distance threshold in meters for triggering audio playback
const PROXIMITY_THRESHOLD = 50; // 50 meters

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const AudioGuide = ({ 
  userPosition, 
  stops, // Array of stops with place data including audioUrl
  places, // All places data
  isNavigating,
  currentRoadmap 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStop, setCurrentStop] = useState(null);
  const [currentPlace, setCurrentPlace] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(new Set()); // Track which stops have auto-played
  const [showPanel, setShowPanel] = useState(false);
  
  const audioRef = useRef(null);
  const lastTriggeredStopRef = useRef(null);

  // Find the nearest stop with audio
  const findNearestStopWithAudio = useCallback(() => {
    if (!userPosition || !stops || !places || stops.length === 0) return null;

    let nearestStop = null;
    let nearestDistance = Infinity;

    for (const stop of stops) {
      const place = places.find(p => p.slug === stop.placeSlug);
      if (!place || !place.audioUrl) continue;

      const distance = calculateDistance(
        userPosition[0], 
        userPosition[1], 
        place.coordinates.lat, 
        place.coordinates.lng
      );

      if (distance < PROXIMITY_THRESHOLD && distance < nearestDistance) {
        nearestDistance = distance;
        nearestStop = { stop, place, distance };
      }
    }

    return nearestStop;
  }, [userPosition, stops, places]);

  // Monitor user position and trigger audio
  useEffect(() => {
    if (!isNavigating || !userPosition) return;

    const nearestStopWithAudio = findNearestStopWithAudio();

    if (nearestStopWithAudio) {
      const { stop, place } = nearestStopWithAudio;
      const stopId = `${stop.order}-${place.slug}`;

      // Show the panel if we're near a stop with audio
      setShowPanel(true);

      // Auto-play if this is a new stop and hasn't been auto-played yet
      if (stopId !== lastTriggeredStopRef.current && !hasAutoPlayed.has(stopId)) {
        lastTriggeredStopRef.current = stopId;
        setCurrentStop(stop);
        setCurrentPlace(place);
        
        // Auto-play the audio
        if (audioRef.current) {
          audioRef.current.src = place.audioUrl;
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              setHasAutoPlayed(prev => new Set([...prev, stopId]));
            })
            .catch(err => {
              console.log('Auto-play was prevented:', err);
              // Still mark as triggered but not auto-played
              // User can manually play
            });
        }
      }
    } else {
      // User moved away from all audio stops
      // Don't hide immediately, keep showing if there's audio playing
      if (!isPlaying) {
        setShowPanel(false);
      }
    }
  }, [userPosition, isNavigating, findNearestStopWithAudio, hasAutoPlayed, isPlaying]);

  // Handle audio time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
    }
  };

  // Handle audio loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current || !currentPlace?.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Playback failed:', err));
    }
  };

  // Seek audio
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * audioDuration;
  };

  // Format time display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Stop and close
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setShowPanel(false);
    setCurrentStop(null);
    setCurrentPlace(null);
  };

  // Reset when navigation stops
  useEffect(() => {
    if (!isNavigating) {
      handleClose();
      setHasAutoPlayed(new Set());
      lastTriggeredStopRef.current = null;
    }
  }, [isNavigating]);

  // Don't render if not navigating or no panel to show
  if (!isNavigating || !showPanel || !currentPlace) return null;

  return (
    <div className={`audio-guide-panel ${isMinimized ? 'minimized' : ''}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentPlace?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Header */}
      <div className="audio-guide-header">
        <div className="audio-guide-title">
          <span className="audio-icon">🎧</span>
          <div className="title-text">
            <h4>Audio Guide</h4>
            <span className="location-name">{currentPlace?.name}</span>
          </div>
        </div>
        <div className="audio-guide-controls-header">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button 
            className="close-btn"
            onClick={handleClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!isMinimized && (
        <div className="audio-guide-body">
          {/* Stop indicator */}
          <div className="stop-indicator">
            <span className="stop-badge">Stop {currentStop?.order}</span>
            <span className="stop-type">
              {currentPlace?.category}
            </span>
          </div>

          {/* Playback controls */}
          <div className="playback-controls">
            <button 
              className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlayPause}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            {/* Progress bar */}
            <div className="progress-container" onClick={handleSeek}>
              <div 
                className="progress-bar"
                style={{ width: `${(audioProgress / audioDuration) * 100 || 0}%` }}
              />
            </div>

            {/* Time display */}
            <div className="time-display">
              <span>{formatTime(audioProgress)}</span>
              <span>/</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>

          {/* Status message */}
          <div className="audio-status">
            {isPlaying ? (
              <span className="status-playing">
                <span className="pulse-dot" />
                Now Playing
              </span>
            ) : (
              <span className="status-paused">
                Tap play to listen
              </span>
            )}
          </div>
        </div>
      )}

      {/* Minimized Content */}
      {isMinimized && (
        <div className="audio-guide-minimized">
          <button 
            className={`play-pause-btn-small ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div className="mini-progress">
            <div 
              className="mini-progress-bar"
              style={{ width: `${(audioProgress / audioDuration) * 100 || 0}%` }}
            />
          </div>
          <span className="mini-time">{formatTime(audioProgress)}</span>
        </div>
      )}
    </div>
  );
};

export default AudioGuide;
