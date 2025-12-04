import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prototype Overview</DialogTitle>
          <DialogDescription className="text-base pt-2">
            This prototype creates a common mapping component for EVAC and Alert. The EVAC functionality doesn't change, while the alert functions move to a set of menus and buttons that appear over the map at the top of the map window.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
