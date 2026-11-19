import React from "react";

import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import "./index.css";


// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log(
        "Service Worker registered:",
        registration.scope
      );
    })
    .catch((error) => {
      console.error(
        "Service Worker registration failed:",
        error
      );
    });
}


// Render React application
createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);