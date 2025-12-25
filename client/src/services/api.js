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

// Semantic Search - connects to the searchEngine API
const SEARCH_API_BASE = process.env.REACT_APP_SEARCH_API_URL || "http://localhost:8000";

export async function semanticSearch(query, topK = 10, includeDetails = true) {
  const response = await fetch(`${SEARCH_API_BASE}/search/detailed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      top_k: topK,
      include_details: includeDetails
    }),
  });
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

export async function basicSearch(query, topK = 10) {
  const response = await fetch(`${SEARCH_API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      top_k: topK
    }),
  });
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

// Search health check
export async function checkSearchHealth() {
  try {
    const response = await fetch(`${SEARCH_API_BASE}/health`);
    if (!response.ok) return { status: 'unhealthy', connected: false };
    return response.json();
  } catch (error) {
    return { status: 'unhealthy', connected: false, error: error.message };
  }
}