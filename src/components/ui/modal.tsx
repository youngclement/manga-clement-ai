'use client';

import { useUIStore } from '@/lib/stores/ui.store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Modal component registry
const MODAL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'confirm-dialog': ConfirmDialog,
  'project-settings': ProjectSettingsModal,
  'generation-settings': GenerationSettingsModal,
  // Add more modals as needed
};

export function ModalContainer() {
  const { modals, closeModal } = useUIStore();

  return (
    <>
      {modals.map((modal) => {
        const ModalComponent = MODAL_COMPONENTS[modal.component];
        
        if (!ModalComponent) {
          console.warn(`Modal component "${modal.component}" not found`);
          return null;
        }

        return (
          <Dialog 
            key={modal.id} 
            open={true} 
            onOpenChange={() => closeModal(modal.id)}
          >
            <DialogContent className="max-w-2xl">
              <ModalComponent 
                {...modal.props} 
                onClose={() => closeModal(modal.id)}
              />
            </DialogContent>
          </Dialog>
        );
      })}
    </>
  );
}

// Confirm Dialog Modal
function ConfirmDialog({ 
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onClose 
}: {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      
      <div className="py-4">
        <p className="text-muted-foreground">{message}</p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button 
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

// Project Settings Modal
function ProjectSettingsModal({ 
  project,
  onSave,
  onClose 
}: {
  project: any;
  onSave: (settings: any) => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Project Settings</DialogTitle>
      </DialogHeader>
      
      <div className="py-4">
        {/* Project settings form would go here */}
        <p>Project settings form placeholder</p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => {
          onSave({});
          onClose();
        }}>
          Save Settings
        </Button>
      </div>
    </>
  );
}

// Generation Settings Modal
function GenerationSettingsModal({ 
  settings,
  onSave,
  onClose 
}: {
  settings: any;
  onSave: (settings: any) => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Generation Settings</DialogTitle>
      </DialogHeader>
      
      <div className="py-4">
        {/* Generation settings form would go here */}
        <p>Generation settings form placeholder</p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => {
          onSave({});
          onClose();
        }}>
          Apply Settings
        </Button>
      </div>
    </>
  );
}

// Modal hooks for easier usage
export function useModal() {
  const { openModal, closeModal } = useUIStore();

  const showConfirm = (props: Parameters<typeof ConfirmDialog>[0]) => {
    return openModal({
      component: 'confirm-dialog',
      props
    });
  };

  const showProjectSettings = (props: Parameters<typeof ProjectSettingsModal>[0]) => {
    return openModal({
      component: 'project-settings',
      props
    });
  };

  const showGenerationSettings = (props: Parameters<typeof GenerationSettingsModal>[0]) => {
    return openModal({
      component: 'generation-settings',
      props
    });
  };

  return {
    showConfirm,
    showProjectSettings,
    showGenerationSettings,
    closeModal
  };
}