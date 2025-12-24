import React, { useState, useEffect, useMemo } from 'react';
import {
  formatDistance,
  formatDuration,
  bearingToCardinal,
  getCurrentInstruction,
  getETA,
  isUserOffRoute,
  TRANSPORT_MODES,
} from '../services/navigationService';
import './NavigationPanel.css';

const NavigationPanel = ({
  route,
  userLocation,
  destination,
  onClose,
  onRecalculate,
  onModeChange,
  isNavigating,
  currentMode = 'foot',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const navigationState = useMemo(() => {
    if (!route || !userLocation) return null;

    const instruction = route.steps ? getCurrentInstruction(userLocation, route.steps) : null;
    const offRoute = isUserOffRoute(userLocation, route.coordinates);
    const eta = getETA(route.distance, currentMode);

    return {
      instruction,
      offRoute,
      eta,
      totalDistance: route.distance,
      totalDuration: route.duration,
    };
  }, [route, userLocation, currentMode]);

  useEffect(() => {
    if (navigationState?.instruction) {
      setCurrentStepIndex(navigationState.instruction.stepIndex);
    }
  }, [navigationState]);

  useEffect(() => {
    if (navigationState?.offRoute && onRecalculate) {
      const timer = setTimeout(() => {
        onRecalculate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [navigationState?.offRoute, onRecalculate]);

  if (!route) return null;

  const currentStep = route.steps?.[currentStepIndex];
  const nextStep = route.steps?.[currentStepIndex + 1];
  const direction = currentStep?.bearing ? bearingToCardinal(currentStep.bearing) : null;
  const modeInfo = TRANSPORT_MODES[currentMode] || TRANSPORT_MODES.foot;

  return (
    <div className={`navigation-panel ${isNavigating ? 'active' : ''}`}>
      {/* Header with Transport Mode Selector */}
      <div className="nav-header">
        <div className="nav-destination">
          <span className="nav-icon">🎯</span>
          <div className="nav-dest-info">
            <h3>{destination?.name || 'Destination'}</h3>
            <span className="nav-eta">
              {navigationState?.eta?.formatted} • {formatDistance(route.distance)}
            </span>
          </div>
        </div>
        <button className="nav-close" onClick={onClose}>✕</button>
      </div>

      {/* Transport Mode Selector */}
      <div className="transport-mode-selector">
        {Object.values(TRANSPORT_MODES).map((mode) => (
          <button
            key={mode.id}
            className={`mode-btn ${currentMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange && onModeChange(mode.id)}
            title={mode.name}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-name">{mode.name}</span>
          </button>
        ))}
      </div>

      {/* Off Route Warning */}
      {navigationState?.offRoute && (
        <div className="nav-warning">
          <span className="warning-icon">⚠️</span>
          <span>You're off route. Recalculating...</span>
          <button onClick={onRecalculate}>Recalculate</button>
        </div>
      )}

      {/* Current Instruction */}
      {currentStep && (
        <div className="nav-current-instruction">
          <div className="instruction-main">
            <div className="direction-icon">
              {getDirectionIcon(currentStep.type, currentStep.modifier)}
            </div>
            <div className="instruction-text">
              <span className="instruction-action">{currentStep.instruction}</span>
              {currentStep.name && currentStep.name !== 'unnamed path' && currentStep.name !== 'unnamed road' && (
                <span className="instruction-road">onto {currentStep.name}</span>
              )}
            </div>
          </div>
          <div className="instruction-distance">
            {formatDistance(navigationState?.instruction?.distanceToStep || currentStep.distance)}
          </div>
        </div>
      )}

      {/* Direction Compass */}
      {direction && (
        <div className="nav-compass">
          <div className="compass-arrow" style={{ transform: `rotate(${currentStep?.bearing || 0}deg)` }}>
            ↑
          </div>
          <span className="compass-direction">{direction.name}</span>
        </div>
      )}

      {/* Next Step Preview */}
      {nextStep && (
        <div className="nav-next-step">
          <span className="next-label">Then</span>
          <span className="next-icon">{getDirectionIcon(nextStep.type, nextStep.modifier)}</span>
          <span className="next-instruction">{nextStep.instruction}</span>
          <span className="next-distance">in {formatDistance(currentStep?.distance || 0)}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="nav-progress">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${Math.max(0, 100 - (route.distance / (navigationState?.totalDistance || route.distance)) * 100)}%` 
          }}
        />
      </div>

      {/* Toggle Steps List */}
      {route.steps && route.steps.length > 0 && (
        <button 
          className="toggle-steps-btn"
          onClick={() => setShowAllSteps(!showAllSteps)}
        >
          {showAllSteps ? 'Hide Steps' : `Show All Steps (${route.steps.length})`}
        </button>
      )}

      {/* All Steps */}
      {showAllSteps && route.steps && (
        <div className="nav-steps-list">
          {route.steps.map((step, index) => (
            <div 
              key={index} 
              className={`nav-step ${index === currentStepIndex ? 'current' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
            >
              <div className="step-icon">
                {index < currentStepIndex ? '✓' : getDirectionIcon(step.type, step.modifier)}
              </div>
              <div className="step-content">
                <span className="step-instruction">{step.instruction}</span>
                {step.name && step.name !== 'unnamed path' && step.name !== 'unnamed road' && (
                  <span className="step-road">{step.name}</span>
                )}
              </div>
              <span className="step-distance">{formatDistance(step.distance)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="nav-stats">
        <div className="stat">
          <span className="stat-icon">{modeInfo.icon}</span>
          <span className="stat-value">{formatDistance(route.distance)}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-icon">⏱️</span>
          <span className="stat-value">{formatDuration(route.duration)}</span>
          <span className="stat-label">Time</span>
        </div>
        <div className="stat">
          <span className="stat-icon">🕐</span>
          <span className="stat-value">{navigationState?.eta?.arrivalTime || '--'}</span>
          <span className="stat-label">ETA</span>
        </div>
      </div>
    </div>
  );
};

function getDirectionIcon(type, modifier) {
  const icons = {
    depart: '🚀',
    arrive: '🎯',
    turn: {
      left: '⬅️',
      right: '➡️',
      'slight left': '↖️',
      'slight right': '↗️',
      'sharp left': '↙️',
      'sharp right': '↘️',
      straight: '⬆️',
      uturn: '🔄',
    },
    'new name': '⬆️',
    continue: '⬆️',
    roundabout: '🔄',
    rotary: '🔄',
    fork: {
      left: '↖️',
      right: '↗️',
      'slight left': '↖️',
      'slight right': '↗️',
    },
    'end of road': {
      left: '⬅️',
      right: '➡️',
    },
  };

  if (typeof icons[type] === 'object') {
    return icons[type][modifier] || '⬆️';
  }
  return icons[type] || '⬆️';
}

export default NavigationPanel;
