import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  eventId: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

export default function DeleteConfirmModal({ eventId, onConfirm, onCancel, isOpen }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={isOpen ? onCancel : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        
        <DialogDescription>
          Are you sure you want to delete this event? This action cannot be undone.
        </DialogDescription>
        
        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add import at the top
import { useState } from "react";
