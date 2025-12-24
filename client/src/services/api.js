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