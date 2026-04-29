import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Building2, ChevronRight } from 'lucide-react';
import { colors, spacing } from '../../styles/cohive-theme';

interface Workspace {
  workspaceHost: string;
  clientName: string;
  displayName: string;
}

interface WorkspaceSelectorProps {
  open: boolean;
  onClose: () => void;
  availableWorkspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
  onWorkspaceSelected: (workspace: Workspace) => void;
}

export function WorkspaceSelector({ 
  open, 
  onClose, 
  availableWorkspaces, 
  onWorkspaceSelected 
}: WorkspaceSelectorProps) {
  const userEmail = localStorage.getItem('cohive_pending_email') || '';
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg" 
        style={{ backgroundColor: colors.background.primary }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3" style={{ color: colors.text.primary }}>
            <Building2 className="h-6 w-6" style={{ color: colors.hex.purple.light }} />
            Select Your Workspace
          </DialogTitle>
          <DialogDescription style={{ color: colors.text.secondary }}>
            {userEmail}
          </DialogDescription>
          <DialogDescription style={{ color: colors.text.secondary, paddingTop: spacing.xs }}>
            As a CoHive Solutions team member, you have access to multiple client workspaces. 
            Please select which workspace you'd like to access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {availableWorkspaces.map((workspace) => (
            <Button
              key={workspace.workspaceHost}
              onClick={() => onWorkspaceSelected(workspace)}
              variant="outline"
              className="w-full justify-between h-auto py-4 px-6 hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.hex.purple.light }}
                >
                  {workspace.displayName.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base" style={{ color: colors.text.primary }}>
                    {workspace.displayName}
                  </div>
                  <div className="text-sm" style={{ color: colors.text.secondary }}>
                    {workspace.workspaceHost}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5" style={{ color: colors.text.secondary }} />
            </Button>
          ))}
        </div>

        <div className="pt-2 border-t" style={{ borderColor: colors.border.light }}>
          <Button 
            onClick={onClose} 
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}