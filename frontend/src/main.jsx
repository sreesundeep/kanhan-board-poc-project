import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { IS_DEV_MODE, DevAuthProvider, ClerkAuthBridge } from "./utils/auth";
import App from "./App";
import "./index.css";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Root() {
  if (IS_DEV_MODE) {
    return (
      <DevAuthProvider>
        <App />
      </DevAuthProvider>
    );
  }
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <ClerkAuthBridge>
        <App />
      </ClerkAuthBridge>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);
