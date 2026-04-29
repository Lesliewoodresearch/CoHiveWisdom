import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Database, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import { colors } from '../../styles/cohive-theme';
import { initiateLogin, clearSession } from '../utils/databricksAuth';

interface DatabricksOAuthLoginProps {
  open: boolean;
  onClose: () => void;
  currentStep?: string;
  onBackToLogin?: () => void;
  selectedWorkspace?: {
    workspaceHost: string;
    clientName: string;
    displayName: string;
  } | null;
}

export function DatabricksOAuthLogin({ open, onClose, currentStep, onBackToLogin, selectedWorkspace }: DatabricksOAuthLoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientName, setClientName] = useState<string>('');

  useEffect(() => {
    if (open) {
      autoConnect();
    }
  }, [open]);

  const autoConnect = async () => {
    setIsLoading(true);
    setError(null);

    const email = localStorage.getItem('cohive_pending_email');

    if (!email) {
      setError('No email found. Please log out and sign in again.');
      setIsLoading(false);
      return;
    }

    try {
      // If a workspace was already selected (CoHiveSolutions users), use that
      if (selectedWorkspace) {
        console.log('✅ Using pre-selected workspace:', selectedWorkspace.displayName);
        setClientName(selectedWorkspace.clientName);
        initiateLogin(selectedWorkspace.workspaceHost, currentStep);
        return;
      }

      // Otherwise, look up workspace by email domain
      const response = await fetch('/api/databricks/workspace-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Could not find your workspace.');
        setIsLoading(false);
        return;
      }

      const { workspaceHost, clientName } = await response.json();
      setClientName(clientName);
      initiateLogin(workspaceHost, currentStep);

    } catch (err) {
      setError('Failed to connect. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Clear all auth state
    clearSession();
    localStorage.removeItem('cohive_pending_email');
    localStorage.removeItem('cohive_logged_in');
    localStorage.setItem('cohive_logged_out', 'true');
    
    // Call the callback if provided
    if (onBackToLogin) {
      onBackToLogin();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md" 
        style={{ backgroundColor: colors.background.primary }}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3" style={{ color: colors.text.primary }}>
            <Database className="h-6 w-6" style={{ color: colors.hex.purple.light }} />
            Connecting to Databricks
          </DialogTitle>
          <DialogDescription style={{ color: colors.text.secondary }}>
            {clientName ? `Connecting to ${clientName} workspace...` : 'Looking up your workspace...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error ? (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={autoConnect} disabled={isLoading} className="w-full gap-2" style={{ backgroundColor: colors.hex.purple.light }}>
                  <LogIn className="h-4 w-4" />
                  Try Again
                </Button>
                {onBackToLogin && (
                  <Button 
                    onClick={handleBackToLogin} 
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3 py-4">
              <Database className="h-6 w-6 animate-pulse" style={{ color: colors.hex.purple.light }} />
              <span style={{ color: colors.text.secondary }}>Redirecting to Databricks...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}