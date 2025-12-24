import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function RouteDisplay({ roadmap, places }) {
  const map = useMap();

  useEffect(() => {
    if (!roadmap || !places || places.length === 0) return;

    // Get coordinates from stops in order
    const routeCoords = roadmap.stops
      .sort((a, b) => a.order - b.order)
      .map((stop) => {
        const place = places.find((p) => p.slug === stop.placeSlug);
        return place ? [place.coordinates.lat, place.coordinates.lng] : null;
      })
      .filter(Boolean);

    if (routeCoords.length < 2) return;

    // Create polyline for the route
    const routeLine = L.polyline(routeCoords, {
      color: roadmap.color || "#333",
      weight: 5,
      opacity: 0.8,
      dashArray: "10, 10",
      lineJoin: "round",
    }).addTo(map);

    // Add animated dots along the route
    const decoratedLine = L.polyline(routeCoords, {
      color: roadmap.color || "#333",
      weight: 8,
      opacity: 0.3,
    }).addTo(map);

    // Fit map to show entire route
    const bounds = L.latLngBounds(routeCoords);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Cleanup on unmount or when roadmap changes
    return () => {
      map.removeLayer(routeLine);
      map.removeLayer(decoratedLine);
    };
  }, [roadmap, places, map]);

  return null;
}