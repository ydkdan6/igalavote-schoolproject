import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface Position {
  id: string;
  title: string;
}

interface Candidate {
  id: string;
  name: string;
  image_url: string | null;
}

interface ResultsChartProps {
  position: Position;
  candidates: Candidate[];
}

interface VoteCount {
  candidate_id: string;
  count: number;
}

const COLORS = ['hsl(142, 72%, 29%)', 'hsl(45, 93%, 47%)', 'hsl(142, 72%, 45%)', 'hsl(45, 93%, 55%)', 'hsl(142, 72%, 60%)'];

export function ResultsChart({ position, candidates }: ResultsChartProps) {
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVoteCounts();
  }, [position.id]);

  const fetchVoteCounts = async () => {
    try {
      const counts: VoteCount[] = [];
      
      for (const candidate of candidates) {
        const { count, error } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('position_id', position.id)
          .eq('candidate_id', candidate.id);
        
        if (!error) {
          counts.push({ candidate_id: candidate.id, count: count || 0 });
        }
      }
      
      setVoteCounts(counts);
    } catch (error) {
      console.error('Error fetching vote counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = candidates.map(candidate => {
    const voteData = voteCounts.find(v => v.candidate_id === candidate.id);
    return {
      name: candidate.name,
      votes: voteData?.count || 0,
    };
  }).sort((a, b) => b.votes - a.votes);

  const totalVotes = chartData.reduce((sum, d) => sum + d.votes, 0);
  const winner = chartData[0];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-xl">{position.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Total Votes: {totalVotes}</p>
            </div>
          </div>
          {winner && winner.votes > 0 && (
            <div className="flex items-center gap-2 bg-accent/10 text-accent-foreground px-3 py-2 rounded-lg">
              <Medal className="w-5 h-5 text-accent" />
              <div className="text-sm">
                <p className="font-medium">{winner.name}</p>
                <p className="text-xs text-muted-foreground">{winner.votes} votes</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalVotes === 0 ? (
          <p className="text-center text-muted-foreground py-8">No votes have been cast yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="votes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
