const API_BASE = "/api";

// Places
export async function getPlaces(category = null) {
  const url = category 
    ? `${API_BASE}/places?category=${category}` 
    : `${API_BASE}/places`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch places");
  return response.json();
}

export async function getPlaceBySlug(slug) {
  const response = await fetch(`${API_BASE}/places/${slug}`);
  if (!response.ok) throw new Error("Place not found");
  return response.json();
}

// Roadmaps
export async function getRoadmaps() {
  const response = await fetch(`${API_BASE}/roadmaps`);
  if (!response.ok) throw new Error("Failed to fetch roadmaps");
  return response.json();
}

export async function getRoadmapFull(slug) {
  const response = await fetch(`${API_BASE}/roadmaps/${slug}/full`);
  if (!response.ok) throw new Error("Roadmap not found");
  return response.json();
}

// Craftsmen
export async function getCraftsmen() {
  const response = await fetch(`${API_BASE}/craftsmen`);
  if (!response.ok) throw new Error("Failed to fetch craftsmen");
  return response.json();
}

export async function getCraftsmanBySlug(slug) {
  const response = await fetch(`${API_BASE}/craftsmen/${slug}`);
  if (!response.ok) throw new Error("Craftsman not found");
  return response.json();
}

// Events
export async function getEvents(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/events?${query}` : `${API_BASE}/events`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}

export async function getFeaturedEvents() {
  const response = await fetch(`${API_BASE}/events/featured`);
  if (!response.ok) throw new Error("Failed to fetch featured events");
  return response.json();
}

export async function getEventBySlug(slug) {
  const response = await fetch(`${API_BASE}/events/${slug}`);
  if (!response.ok) throw new Error("Event not found");
  return response.json();
}

// Bookings (requires authentication)
export async function createBooking(bookingData, token) {
  const response = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(bookingData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create booking");
  }
  return response.json();
}

export async function getMyBookings(token) {
  const response = await fetch(`${API_BASE}/bookings/my-bookings`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch bookings");
  return response.json();
}

export async function cancelBooking(bookingId, token, reason = "") {
  const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to cancel booking");
  }
  return data;
}