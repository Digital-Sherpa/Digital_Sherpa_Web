import { useState, useEffect } from "react";
import { getRoadmaps } from "../services/api";
import "./RoadmapSelector.css";

export default function RoadmapSelector({ onSelectRoadmap, selectedRoadmap }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRoadmaps() {
      try {
        const data = await getRoadmaps();
        setRoadmaps(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchRoadmaps();
  }, []);

  if (loading) return <div className="roadmap-selector">Loading trails...</div>;
  if (error) return <div className="roadmap-selector error">Error: {error}</div>;

  return (
    <div className="roadmap-selector">
      <h3>🗺️ Select a Trail</h3>
      <div className="roadmap-list">
        {roadmaps.map((roadmap) => (
          <button
            key={roadmap._id}
            className={`roadmap-card ${selectedRoadmap?.slug === roadmap.slug ? "active" : ""}`}
            onClick={() => onSelectRoadmap(roadmap)}
            style={{ borderColor: roadmap.color }}
          >
            <span className="roadmap-icon">{roadmap.icon}</span>
            <div className="roadmap-info">
              <h4>{roadmap.name}</h4>
              <p>{roadmap.duration} • {roadmap.distance}</p>
            </div>
          </button>
        ))}
        {selectedRoadmap && (
          <button 
            className="roadmap-card clear-btn"
            onClick={() => onSelectRoadmap(null)}
          >
            ✕ Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}