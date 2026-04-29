import { useState } from 'react';
import { Database, User, CircleCheck, CircleAlert } from 'lucide-react';
import { HexagonBreadcrumb } from "./components/HexagonBreadcrumb";
import { AIHelpWidget } from "./components/AIHelpWidget";
import { DatabricksOAuthLogin } from "./components/DatabricksOAuthLogin";
import { Login } from "./components/Login";
import { isAuthenticated as isDatabricksAuthenticated } from './utils/databricksAuth';
import cohiveLogo from "../imports/CoHiveLogo.png";
import { stepColors } from '../styles/cohive-theme';

function WisdomApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('cohive_logged_in') === 'true';
  });
  const [isDatabricksAuth, setIsDatabricksAuth] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useState(() => {
    setTimeout(() => {
      const authenticated = isDatabricksAuthenticated();
      setIsDatabricksAuth(authenticated);
      setIsCheckingAuth(false);
    }, 500);
  });

  const handleLogin = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('cohive_logged_in', 'true');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('cohive_logged_in');
      window.location.reload();
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={cohiveLogo} alt="CoHive - Insight into Inspiration" className="h-24" />
        </div>

        {/* Share Your Wisdom Hex */}
        <div className="flex justify-center">
          <HexagonBreadcrumb
            label={`Share Your
Wisdom`}
            color={stepColors.Wisdom}
            status="active"
            onClick={() => {}}
            size="xlarge"
          />
        </div>

        {/* Databricks Authentication */}
        <div className="w-full max-w-md">
          {isCheckingAuth ? (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-gray-700 text-sm">Checking Databricks authentication...</span>
              </div>
            </div>
          ) : isDatabricksAuth ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-green-600" />
                <span className="text-gray-900 text-sm font-medium">Connected to Databricks</span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-gray-900 font-medium mb-1">Databricks Authentication Required</h4>
                  <p className="text-gray-700 text-sm mb-3">
                    Connect to Databricks to save your wisdom and insights.
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    Sign In to Databricks
                  </button>
                  <div className="mt-3 text-xs text-gray-600">
                    <p className="mb-1">✓ Secure OAuth 2.0 authentication</p>
                    <p className="mb-1">✓ Your credentials never leave Databricks</p>
                    <p>✓ Access your organization's Knowledge Base</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Help Widget */}
        <div className="w-full max-w-md flex justify-center">
          <AIHelpWidget
            activeHexId="Wisdom"
            activeHexLabel="Share Your Wisdom"
            userEmail={userEmail}
            userRole="marketing-manager"
            wisdomInputMethod={null}
          />
        </div>

        {/* Log Out Button */}
        <div className="w-full max-w-md">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 border-2 border-gray-500 text-gray-700 rounded flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <User className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Databricks OAuth Modal */}
      <DatabricksOAuthLogin
        open={showLoginModal}
        currentStep="Wisdom"
        onClose={() => {
          setShowLoginModal(false);
          setTimeout(() => {
            const authenticated = isDatabricksAuthenticated();
            setIsDatabricksAuth(authenticated);
          }, 500);
        }}
      />
    </div>
  );
}

export default WisdomApp;
