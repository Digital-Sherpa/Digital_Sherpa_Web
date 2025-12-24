/**
 * Navigation Service for Digital Sherpa
 * Provides accurate distance calculation, routing, and turn-by-turn directions
 * Supports multiple transportation modes: walking, cycling, driving
 */

// Transport mode profiles for OSRM
export const TRANSPORT_MODES = {
  foot: {
    id: 'foot',
    name: 'Walking',
    icon: '🚶',
    speed: 1.4, // m/s (~5 km/h)
    osrmProfile: 'foot',
  },
  bike: {
    id: 'bike',
    name: 'Cycling',
    icon: '🚴',
    speed: 4.2, // m/s (~15 km/h)
    osrmProfile: 'bike',
  },
  car: {
    id: 'car',
    name: 'Driving',
    icon: '🚗',
    speed: 8.3, // m/s (~30 km/h for city)
    osrmProfile: 'car',
  },
};

// Calculate distance between two points using Haversine formula (meters)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Format distance for display
export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return '--';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

// Format duration for display
export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '--';
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Calculate bearing between two points (degrees from North)
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

// Convert bearing to cardinal direction
export function bearingToCardinal(bearing) {
  const directions = [
    { name: "North", short: "N", min: 337.5, max: 360 },
    { name: "North", short: "N", min: 0, max: 22.5 },
    { name: "Northeast", short: "NE", min: 22.5, max: 67.5 },
    { name: "East", short: "E", min: 67.5, max: 112.5 },
    { name: "Southeast", short: "SE", min: 112.5, max: 157.5 },
    { name: "South", short: "S", min: 157.5, max: 202.5 },
    { name: "Southwest", short: "SW", min: 202.5, max: 247.5 },
    { name: "West", short: "W", min: 247.5, max: 292.5 },
    { name: "Northwest", short: "NW", min: 292.5, max: 337.5 },
  ];

  for (const dir of directions) {
    if (bearing >= dir.min && bearing < dir.max) {
      return dir;
    }
  }
  return { name: "North", short: "N" };
}

// Get turn direction based on bearing change
export function getTurnDirection(prevBearing, newBearing) {
  let diff = newBearing - prevBearing;
  
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  if (Math.abs(diff) < 20) return { type: "straight", icon: "⬆️", text: "Continue straight" };
  if (diff >= 20 && diff < 60) return { type: "slight-right", icon: "↗️", text: "Slight right" };
  if (diff >= 60 && diff < 120) return { type: "right", icon: "➡️", text: "Turn right" };
  if (diff >= 120) return { type: "sharp-right", icon: "↘️", text: "Sharp right" };
  if (diff <= -20 && diff > -60) return { type: "slight-left", icon: "↖️", text: "Slight left" };
  if (diff <= -60 && diff > -120) return { type: "left", icon: "⬅️", text: "Turn left" };
  if (diff <= -120) return { type: "sharp-left", icon: "↙️", text: "Sharp left" };
  
  return { type: "straight", icon: "⬆️", text: "Continue straight" };
}

// Fetch detailed route from OSRM with steps - SUPPORTS MULTIPLE MODES
export async function getDetailedRoute(start, end, mode = 'foot') {
  const profile = TRANSPORT_MODES[mode]?.osrmProfile || 'foot';
  
  try {
    // OSRM public demo server - for production, use your own OSRM instance
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true&annotations=true`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((coord) => [
      coord[1],
      coord[0],
    ]);

    // Process steps for turn-by-turn directions
    const steps = [];
    if (route.legs && route.legs[0] && route.legs[0].steps) {
      for (const step of route.legs[0].steps) {
        if (step.maneuver) {
          steps.push({
            instruction: step.maneuver.instruction || getManeuverInstruction(step.maneuver),
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            distance: step.distance,
            duration: step.duration,
            name: step.name || "unnamed road",
            location: [step.maneuver.location[1], step.maneuver.location[0]],
            bearing: step.maneuver.bearing_after,
          });
        }
      }
    }

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      steps,
      mode,
    };
  } catch (error) {
    console.error("Detailed routing error:", error);
    return null;
  }
}

// Generate maneuver instruction if not provided
function getManeuverInstruction(maneuver) {
  const type = maneuver.type;
  const modifier = maneuver.modifier;

  const instructions = {
    depart: "Start your journey",
    arrive: "You have arrived",
    turn: modifier ? `Turn ${modifier}` : "Turn",
    "new name": "Continue onto",
    merge: "Merge",
    "on ramp": "Take ramp",
    "off ramp": "Exit ramp",
    fork: modifier ? `Keep ${modifier}` : "Fork",
    "end of road": modifier ? `Turn ${modifier}` : "End of road",
    continue: "Continue",
    roundabout: "Enter roundabout",
    rotary: "Enter rotary",
    "roundabout turn": modifier ? `Turn ${modifier}` : "Roundabout",
    notification: "",
    "exit roundabout": "Exit roundabout",
    "exit rotary": "Exit rotary",
  };

  return instructions[type] || "Continue";
}

// Get complete route through multiple waypoints - SUPPORTS MULTIPLE MODES
export async function getMultiPointRoute(waypoints, mode = 'foot') {
  if (waypoints.length < 2) return null;

  const profile = TRANSPORT_MODES[mode]?.osrmProfile || 'foot';

  try {
    const coordString = waypoints
      .map((wp) => `${wp[1]},${wp[0]}`)
      .join(";");

    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=true&annotations=true`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return await getSegmentedRoute(waypoints, mode);
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((coord) => [
      coord[1],
      coord[0],
    ]);

    const allSteps = [];
    let cumulativeDistance = 0;

    if (route.legs) {
      route.legs.forEach((leg, legIndex) => {
        if (leg.steps) {
          leg.steps.forEach((step) => {
            if (step.maneuver) {
              allSteps.push({
                instruction: step.maneuver.instruction || getManeuverInstruction(step.maneuver),
                type: step.maneuver.type,
                modifier: step.maneuver.modifier,
                distance: step.distance,
                duration: step.duration,
                name: step.name || "unnamed path",
                location: [step.maneuver.location[1], step.maneuver.location[0]],
                bearing: step.maneuver.bearing_after,
                legIndex,
                cumulativeDistance,
              });
              cumulativeDistance += step.distance;
            }
          });
        }
      });
    }

    const legDistances = route.legs.map((leg) => ({
      distance: leg.distance,
      duration: leg.duration,
    }));

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      steps: allSteps,
      legDistances,
      mode,
    };
  } catch (error) {
    console.error("Multi-point routing error:", error);
    return await getSegmentedRoute(waypoints, mode);
  }
}

// Fallback: Get route segment by segment
async function getSegmentedRoute(waypoints, mode = 'foot') {
  const allCoords = [];
  const allSteps = [];
  let totalDistance = 0;
  let totalDuration = 0;
  const legDistances = [];
  const speed = TRANSPORT_MODES[mode]?.speed || 1.4;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = await getDetailedRoute(waypoints[i], waypoints[i + 1], mode);

    if (segment) {
      if (allCoords.length > 0) {
        allCoords.push(...segment.coordinates.slice(1));
      } else {
        allCoords.push(...segment.coordinates);
      }

      segment.steps.forEach((step) => {
        allSteps.push({
          ...step,
          legIndex: i,
          cumulativeDistance: totalDistance + step.distance,
        });
      });

      legDistances.push({
        distance: segment.distance,
        duration: segment.duration,
      });

      totalDistance += segment.distance;
      totalDuration += segment.duration;
    } else {
      if (allCoords.length === 0) {
        allCoords.push(waypoints[i]);
      }
      allCoords.push(waypoints[i + 1]);

      const dist = calculateDistance(
        waypoints[i][0], waypoints[i][1],
        waypoints[i + 1][0], waypoints[i + 1][1]
      );
      legDistances.push({ distance: dist, duration: dist / speed });
      totalDistance += dist;
      totalDuration += dist / speed;
    }
  }

  return {
    coordinates: allCoords,
    distance: totalDistance,
    duration: totalDuration,
    steps: allSteps,
    legDistances,
    mode,
  };
}

// Calculate user's distance to a point
export function getDistanceToPoint(userLocation, targetLocation) {
  if (!userLocation || !targetLocation) return null;
  
  return calculateDistance(
    userLocation[0], userLocation[1],
    targetLocation[0], targetLocation[1]
  );
}

// Get navigation info from user to target - SUPPORTS MULTIPLE MODES
export async function getNavigationToPoint(userLocation, targetLocation, mode = 'foot') {
  const route = await getDetailedRoute(userLocation, targetLocation, mode);
  
  if (!route) {
    const distance = calculateDistance(
      userLocation[0], userLocation[1],
      targetLocation[0], targetLocation[1]
    );
    const bearing = calculateBearing(
      userLocation[0], userLocation[1],
      targetLocation[0], targetLocation[1]
    );
    const direction = bearingToCardinal(bearing);
    const speed = TRANSPORT_MODES[mode]?.speed || 1.4;
    
    return {
      distance,
      duration: distance / speed,
      bearing,
      direction,
      coordinates: [userLocation, targetLocation],
      steps: [{
        instruction: `Head ${direction.name} toward destination`,
        distance,
        duration: distance / speed,
        location: userLocation,
        bearing,
      }],
      isEstimate: true,
      mode,
    };
  }

  const bearing = calculateBearing(
    userLocation[0], userLocation[1],
    targetLocation[0], targetLocation[1]
  );
  const direction = bearingToCardinal(bearing);

  return {
    ...route,
    bearing,
    direction,
    isEstimate: false,
  };
}

// Get current navigation instruction based on user location
export function getCurrentInstruction(userLocation, steps) {
  if (!userLocation || !steps || steps.length === 0) return null;

  let closestStep = null;
  let closestDistance = Infinity;
  let stepIndex = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.location) continue;
    
    const dist = calculateDistance(
      userLocation[0], userLocation[1],
      step.location[0], step.location[1]
    );

    if (dist < closestDistance && dist < 200) {
      closestDistance = dist;
      closestStep = step;
      stepIndex = i;
    }
  }

  if (!closestStep) {
    return {
      step: steps[0],
      distanceToStep: steps[0]?.location ? calculateDistance(
        userLocation[0], userLocation[1],
        steps[0].location[0], steps[0].location[1]
      ) : 0,
      stepIndex: 0,
      isOffRoute: true,
    };
  }

  return {
    step: closestStep,
    distanceToStep: closestDistance,
    stepIndex,
    isOffRoute: false,
  };
}

// Check if user is off route
export function isUserOffRoute(userLocation, routeCoordinates, threshold = 50) {
  if (!userLocation || !routeCoordinates || routeCoordinates.length === 0) {
    return false;
  }

  let minDistance = Infinity;

  for (const coord of routeCoordinates) {
    const dist = calculateDistance(
      userLocation[0], userLocation[1],
      coord[0], coord[1]
    );
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance > threshold;
}

// Get ETA based on remaining distance and mode
export function getETA(remainingDistance, mode = 'foot') {
  const speed = TRANSPORT_MODES[mode]?.speed || 1.4;
  const seconds = remainingDistance / speed;
  const arrival = new Date(Date.now() + seconds * 1000);
  
  return {
    seconds,
    formatted: formatDuration(seconds),
    arrivalTime: arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// Find nearest road/path point for better routing
export async function findNearestRoad(location, mode = 'foot') {
  const profile = TRANSPORT_MODES[mode]?.osrmProfile || 'foot';
  
  try {
    const url = `https://router.project-osrm.org/nearest/v1/${profile}/${location[1]},${location[0]}?number=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
      const wp = data.waypoints[0];
      return {
        location: [wp.location[1], wp.location[0]],
        name: wp.name || 'Nearest road',
        distance: wp.distance,
      };
    }
    return null;
  } catch (error) {
    console.error('Nearest road error:', error);
    return null;
  }
}