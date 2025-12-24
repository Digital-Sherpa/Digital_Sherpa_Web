import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import AdminApp from "./admin/AdminApp";

// Simple admin authentication middleware (placeholder for now)
const adminAuth = (req, res, next) => {
  // TODO: Implement proper authentication
  // For now, allow all requests (NOT SECURE FOR PRODUCTION)
  next();
};

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

export default adminAuth;