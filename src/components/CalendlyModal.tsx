"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function CalendlyModal({ isOpen, onClose, url }: CalendlyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[90vh] md:w-[80vw] md:h-[90vh] p-0">
        <div className="flex-1 w-full h-full">
          <iframe
            src={url}
            width="100%"
            height="100%"
            frameBorder="0"
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
} 