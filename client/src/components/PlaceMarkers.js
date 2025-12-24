import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";

// Different icons for different place types
const icons = {
  historical: new Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  workshop: new Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  restaurant: new Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  default: new Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

export default function PlaceMarkers({ places, roadmap }) {
  if (!places || places.length === 0) return null;

  // Get stop order for numbering
  const getStopNumber = (placeSlug) => {
    if (!roadmap) return null;
    const stop = roadmap.stops.find((s) => s.placeSlug === placeSlug);
    return stop ? stop.order : null;
  };

  // Check if place is sponsored
  const isSponsored = (placeSlug) => {
    if (!roadmap) return false;
    return roadmap.sponsoredStops.some((s) => s.placeSlug === placeSlug);
  };

  return (
    <>
      {places.map((place) => {
        const stopNumber = getStopNumber(place.slug);
        const sponsored = isSponsored(place.slug);
        const icon = icons[place.category] || icons.default;

        return (
          <Marker
            key={place._id}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={icon}
          >
            <Popup>
              <div className="place-popup">
                {stopNumber && (
                  <span className="stop-number">Stop {stopNumber}</span>
                )}
                {sponsored && <span className="sponsored-badge">⭐ Sponsored</span>}
                <h3>{place.name}</h3>
                <p>{place.description}</p>
                {place.openingHours && (
                  <p className="hours">🕐 {place.openingHours}</p>
                )}
                {place.hasWorkshop && (
                  <p className="workshop-badge">🎨 Workshop Available</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}