import { motion } from 'framer-motion';
import { User, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Candidate {
  id: string;
  name: string;
  image_url: string | null;
  manifesto: string | null;
}

interface CandidateCardProps {
  candidate: Candidate;
  onVote: () => void;
  showVoteButton?: boolean;
}

export function CandidateCard({ candidate, onVote, showVoteButton = true }: CandidateCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {candidate.image_url ? (
            <img
              src={candidate.image_url}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1">{candidate.name}</h3>
          {candidate.manifesto && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {candidate.manifesto}
            </p>
          )}
          {showVoteButton && (
            <Button onClick={onVote} className="w-full btn-primary-gradient">
              <Vote className="w-4 h-4 mr-2" />
              Vote
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
