import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, AlertTriangle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Candidate {
  id: string;
  name: string;
  image_url: string | null;
}

interface Position {
  id: string;
  title: string;
}

interface VoteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  candidate: Candidate | null;
  position: Position | null;
}

export function VoteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  candidate,
  position,
}: VoteConfirmationModalProps) {
  if (!candidate || !position) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-accent" />
              </div>

              <h2 className="text-2xl font-bold mb-2">Confirm Your Vote</h2>
              <p className="text-muted-foreground mb-6">
                You are about to vote for <strong>{candidate.name}</strong> for the position of{' '}
                <strong>{position.title}</strong>. This action cannot be undone.
              </p>

              {/* Candidate Preview */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {candidate.image_url ? (
                    <img
                      src={candidate.image_url}
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground">{position.title}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={onConfirm} className="flex-1 btn-primary-gradient">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Vote
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
