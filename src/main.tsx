import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import X402Demo from "./X402Demo";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found");
}

const isDemoRoute =
  window.location.pathname === "/demo" ||
  window.location.pathname.startsWith("/demo/");

createRoot(root).render(
  <StrictMode>{isDemoRoute ? <X402Demo /> : <App />}</StrictMode>
);
