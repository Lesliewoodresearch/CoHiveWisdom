import { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import WisdomApp from "./App_Simple";
import { Login } from "./components/Login";
import { OAuthCallback } from "./components/OAuthCallback";
import { isAuthenticated as isDatabricksAuthenticated } from './utils/databricksAuth';
import gemIcon from "figma:asset/53dc6cf554f69e479cfbd60a46741f158d11dd21.png";

function AppContent() {
  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = gemIcon;
    document.head.appendChild(link);
  }, []);

  return <WisdomApp />;
}

function OAuthCallbackWrapper() {
  return (
    <OAuthCallback 
      onSuccess={() => {
        console.log('✅ OAuth successful, returning to app...');
        localStorage.setItem('cohive_logged_in', 'true');
        window.location.href = '/';
      }}
      onError={(error) => {
        console.error('❌ OAuth error:', error);
        const errorMsg = typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Unknown error');
        
        // Clear all auth state and send back to landing page
        localStorage.removeItem('cohive_pending_email');
        localStorage.removeItem('cohive_logged_in');
        localStorage.setItem('cohive_logged_out', 'true');
        
        alert(`Databricks authentication failed: ${errorMsg}.\n\nYou will be returned to the login page. Please verify your Databricks credentials or contact your administrator.`);
        window.location.href = '/';
      }}
    />
  );
}

const router = createBrowserRouter([
  {
    path: "/oauth/callback",
    element: <OAuthCallbackWrapper />,
  },
  {
    path: "*",
    element: <AppContent />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}