/**
 * Mock Mode - Only for Help@cohive.com
 * Bypasses Databricks authentication ONLY when user logs in with Help@cohive.com
 */

// Mock mode is ONLY triggered by Help@cohive.com login
// This function is no longer used for environment detection
export const isFigmaMake = (): boolean => {
  return false; // Disabled - mock mode only via Help@cohive.com
};

// Mock session for Help@cohive.com
export const getMockSession = () => ({
  accessToken: 'mock-token-help-account',
  workspaceHost: 'mock-workspace.databricks.com',
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
  userEmail: 'help@cohive.com',
  userName: 'Help Account',
});