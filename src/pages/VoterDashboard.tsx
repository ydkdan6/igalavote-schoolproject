import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Vote, CheckCircle2, BarChart3, LogOut, User, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoteConfirmationModal } from '@/components/voting/VoteConfirmationModal';
import { CandidateCard } from '@/components/voting/CandidateCard';
import { ResultsChart } from '@/components/results/ResultsChart';

interface Position {
  id: string;
  title: string;
  description: string | null;
}

interface Candidate {
  id: string;
  position_id: string;
  name: string;
  image_url: string | null;
  manifesto: string | null;
}

interface Vote {
  position_id: string;
  candidate_id: string;
}

interface PublishedResult {
  position_id: string;
}

export default function VoterDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [publishedResults, setPublishedResults] = useState<PublishedResult[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [posRes, candRes, voteRes, pubRes, profRes] = await Promise.all([
        supabase.from('positions').select('*').eq('is_active', true).order('display_order'),
        supabase.from('candidates').select('*'),
        supabase.from('votes').select('position_id, candidate_id').eq('voter_id', user.id),
        supabase.from('results_published').select('position_id'),
        supabase.from('profiles').select('name').eq('user_id', user.id).maybeSingle(),
      ]);

      if (posRes.data) setPositions(posRes.data);
      if (candRes.data) setCandidates(candRes.data);
      if (voteRes.data) setUserVotes(voteRes.data);
      if (pubRes.data) setPublishedResults(pubRes.data);
      if (profRes.data) setProfile(profRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (candidate: Candidate, position: Position) => {
    const hasVoted = userVotes.some(v => v.position_id === position.id);
    if (hasVoted) {
      toast({
        title: 'Already Voted',
        description: `You have already cast your vote for ${position.title}.`,
        variant: 'destructive',
      });
      return;
    }
    setSelectedCandidate(candidate);
    setSelectedPosition(position);
    setShowConfirmModal(true);
  };

  const confirmVote = async () => {
    if (!selectedCandidate || !selectedPosition || !user) return;

    try {
      const { error } = await supabase.from('votes').insert({
        voter_id: user.id,
        position_id: selectedPosition.id,
        candidate_id: selectedCandidate.id,
      });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast({
            title: 'Already Voted',
            description: 'You have already voted for this position.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Vote Cast Successfully!',
          description: `Your vote for ${selectedCandidate.name} has been recorded.`,
        });
        setUserVotes([...userVotes, { position_id: selectedPosition.id, candidate_id: selectedCandidate.id }]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cast vote. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowConfirmModal(false);
      setSelectedCandidate(null);
      setSelectedPosition(null);
    }
  };

  const hasVotedFor = (positionId: string) => userVotes.some(v => v.position_id === positionId);
  const getVotedCandidate = (positionId: string) => {
    const vote = userVotes.find(v => v.position_id === positionId);
    return vote ? candidates.find(c => c.id === vote.candidate_id) : null;
  };

  const votingProgress = positions.length > 0 ? (userVotes.length / positions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Vote className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Igala Voting</h1>
              <p className="text-xs text-primary-foreground/70">Voter Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              <span>{profile?.name || 'Voter'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Welcome, {profile?.name || 'Voter'}!</h2>
                  <p className="text-primary-foreground/80">Cast your votes for the positions below</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{userVotes.length}/{positions.length}</p>
                  <p className="text-sm text-primary-foreground/70">Votes Cast</p>
                </div>
              </div>
              <div className="w-full bg-primary-foreground/20 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${votingProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="bg-accent h-3 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="vote" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="vote" className="flex items-center gap-2">
              <Vote className="w-4 h-4" />
              Vote
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vote" className="space-y-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading positions...</p>
              </div>
            ) : positions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Vote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active positions available for voting.</p>
                </CardContent>
              </Card>
            ) : (
              positions.map((position, index) => {
                const positionCandidates = candidates.filter(c => c.position_id === position.id);
                const voted = hasVotedFor(position.id);
                const votedCandidate = getVotedCandidate(position.id);

                return (
                  <motion.div
                    key={position.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">{position.title}</CardTitle>
                              {position.description && (
                                <p className="text-sm text-muted-foreground">{position.description}</p>
                              )}
                            </div>
                          </div>
                          {voted && (
                            <div className="flex items-center gap-2 text-success bg-success/10 px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Voted</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {voted ? (
                          <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                            <p className="font-medium">You voted for {votedCandidate?.name}</p>
                            <p className="text-sm text-muted-foreground">Thank you for participating!</p>
                          </div>
                        ) : positionCandidates.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No candidates registered for this position yet.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {positionCandidates.map(candidate => (
                              <CandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                onVote={() => handleVoteClick(candidate, position)}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {publishedResults.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Results Not Yet Available</p>
                  <p className="text-muted-foreground">
                    Results will be visible here once the admin publishes them.
                  </p>
                </CardContent>
              </Card>
            ) : (
              positions
                .filter(p => publishedResults.some(r => r.position_id === p.id))
                .map((position, index) => (
                  <motion.div
                    key={position.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ResultsChart position={position} candidates={candidates.filter(c => c.position_id === position.id)} />
                  </motion.div>
                ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <VoteConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmVote}
        candidate={selectedCandidate}
        position={selectedPosition}
      />
    </div>
  );
}
