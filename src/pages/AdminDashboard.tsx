import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Vote, Users, Trophy, BarChart3, LogOut, Plus, Trash2, Send, Upload, Image, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResultsChart } from '@/components/results/ResultsChart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['hsl(142, 72%, 29%)', 'hsl(45, 93%, 47%)', 'hsl(142, 72%, 45%)', 'hsl(45, 93%, 55%)'];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [publishedResults, setPublishedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add position state
  const [newPosition, setNewPosition] = useState({ title: '', description: '' });
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  
  // Edit position state
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [editPositionOpen, setEditPositionOpen] = useState(false);
  
  // Add candidate state
  const [newCandidate, setNewCandidate] = useState({ name: '', manifesto: '', position_id: '', image: null as File | null });
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  
  // Edit candidate state
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [editCandidateImage, setEditCandidateImage] = useState<File | null>(null);
  const [editCandidateOpen, setEditCandidateOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [posRes, candRes, voterRes, voteRes, pubRes] = await Promise.all([
      supabase.from('positions').select('*').order('display_order'),
      supabase.from('candidates').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('votes').select('*'),
      supabase.from('results_published').select('*'),
    ]);
    if (posRes.data) setPositions(posRes.data);
    if (candRes.data) setCandidates(candRes.data);
    if (voterRes.data) setVoters(voterRes.data);
    if (voteRes.data) setVotes(voteRes.data);
    if (pubRes.data) setPublishedResults(pubRes.data);
    setLoading(false);
  };

  // Position CRUD
  const addPosition = async () => {
    if (!newPosition.title) return;
    const { error } = await supabase.from('positions').insert({ 
      title: newPosition.title, 
      description: newPosition.description, 
      display_order: positions.length 
    });
    if (!error) { 
      toast({ title: 'Position Added!' }); 
      setNewPosition({ title: '', description: '' }); 
      setAddPositionOpen(false);
      fetchData(); 
    } else {
      toast({ title: 'Error adding position', description: error.message, variant: 'destructive' });
    }
  };

  const updatePosition = async () => {
    if (!editingPosition?.title) return;
    const { error } = await supabase.from('positions')
      .update({ title: editingPosition.title, description: editingPosition.description })
      .eq('id', editingPosition.id);
    if (!error) { 
      toast({ title: 'Position Updated!' }); 
      setEditingPosition(null); 
      setEditPositionOpen(false);
      fetchData(); 
    } else {
      toast({ title: 'Error updating position', description: error.message, variant: 'destructive' });
    }
  };

  const deletePosition = async (id: string) => {
    await supabase.from('positions').delete().eq('id', id);
    toast({ title: 'Position Deleted' }); 
    fetchData();
  };

  // Candidate CRUD
  const addCandidate = async () => {
    if (!newCandidate.name || !newCandidate.position_id) return;
    setUploading(true);
    let imageUrl = null;
    if (newCandidate.image) {
      const fileExt = newCandidate.image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage.from('candidate-images').upload(fileName, newCandidate.image);
      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage.from('candidate-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }
    const { error } = await supabase.from('candidates').insert({ 
      name: newCandidate.name, 
      manifesto: newCandidate.manifesto, 
      position_id: newCandidate.position_id, 
      image_url: imageUrl 
    });
    if (!error) { 
      toast({ title: 'Candidate Added!' }); 
      setNewCandidate({ name: '', manifesto: '', position_id: '', image: null }); 
      setAddCandidateOpen(false);
      fetchData(); 
    } else {
      toast({ title: 'Error adding candidate', description: error.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const updateCandidate = async () => {
    if (!editingCandidate?.name) return;
    setUploading(true);
    let imageUrl = editingCandidate.image_url;
    
    if (editCandidateImage) {
      const fileExt = editCandidateImage.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage.from('candidate-images').upload(fileName, editCandidateImage);
      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage.from('candidate-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }
    
    const { error } = await supabase.from('candidates')
      .update({ 
        name: editingCandidate.name, 
        manifesto: editingCandidate.manifesto, 
        position_id: editingCandidate.position_id,
        image_url: imageUrl 
      })
      .eq('id', editingCandidate.id);
      
    if (!error) { 
      toast({ title: 'Candidate Updated!' }); 
      setEditingCandidate(null); 
      setEditCandidateImage(null);
      setEditCandidateOpen(false);
      fetchData(); 
    } else {
      toast({ title: 'Error updating candidate', description: error.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const deleteCandidate = async (id: string) => {
    await supabase.from('candidates').delete().eq('id', id);
    toast({ title: 'Candidate Deleted' }); 
    fetchData();
  };

  const publishResults = async (positionId: string) => {
    const { error } = await supabase.from('results_published').insert({ position_id: positionId, published_by: user?.id });
    if (!error) { 
      toast({ title: 'Results Published!' }); 
      fetchData(); 
    }
  };

  const stats = [
    { title: 'Total Voters', value: voters.length, icon: Users, color: 'bg-primary' },
    { title: 'Positions', value: positions.length, icon: Trophy, color: 'bg-accent' },
    { title: 'Candidates', value: candidates.length, icon: Vote, color: 'bg-primary' },
    { title: 'Total Votes', value: votes.length, icon: BarChart3, color: 'bg-accent' },
  ];

  const votesByPosition = positions.map(p => ({ name: p.title, votes: votes.filter(v => v.position_id === p.id).length }));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Vote className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Igala Voting</h1>
              <p className="text-xs text-primary-foreground/70">Admin Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="w-4 h-4 mr-2" />Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Votes by Position</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={votesByPosition}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="votes" fill="hsl(142, 72%, 29%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="voters">Voters</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Positions</CardTitle>
                <Dialog open={addPositionOpen} onOpenChange={setAddPositionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="btn-primary-gradient">
                      <Plus className="w-4 h-4 mr-1" />Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Position</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input value={newPosition.title} onChange={e => setNewPosition({ ...newPosition, title: e.target.value })} />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={newPosition.description} onChange={e => setNewPosition({ ...newPosition, description: e.target.value })} />
                      </div>
                      <Button onClick={addPosition} className="w-full btn-primary-gradient">Add Position</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {positions.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-2">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setEditingPosition(p); setEditPositionOpen(true); }}
                      >
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePosition(p.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Edit Position Dialog */}
            <Dialog open={editPositionOpen} onOpenChange={setEditPositionOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Position</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input 
                      value={editingPosition?.title || ''} 
                      onChange={e => setEditingPosition({ ...editingPosition, title: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      value={editingPosition?.description || ''} 
                      onChange={e => setEditingPosition({ ...editingPosition, description: e.target.value })} 
                    />
                  </div>
                  <Button onClick={updatePosition} className="w-full btn-primary-gradient">Update Position</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Candidates</CardTitle>
                <Dialog open={addCandidateOpen} onOpenChange={setAddCandidateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="btn-primary-gradient">
                      <Plus className="w-4 h-4 mr-1" />Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Position</Label>
                        <Select value={newCandidate.position_id} onValueChange={v => setNewCandidate({ ...newCandidate, position_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                          <SelectContent>
                            {positions.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Manifesto</Label>
                        <Textarea value={newCandidate.manifesto} onChange={e => setNewCandidate({ ...newCandidate, manifesto: e.target.value })} />
                      </div>
                      <div>
                        <Label>Photo (max 5MB)</Label>
                        <input 
                          ref={fileInputRef} 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={e => { 
                            if (e.target.files?.[0] && e.target.files[0].size <= 5242880) {
                              setNewCandidate({ ...newCandidate, image: e.target.files[0] }); 
                            } else {
                              toast({ title: 'File too large', variant: 'destructive' }); 
                            }
                          }} 
                        />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          {newCandidate.image ? newCandidate.image.name : 'Upload Image'}
                        </Button>
                      </div>
                      <Button onClick={addCandidate} className="w-full btn-primary-gradient" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Add Candidate'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {candidates.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-2">
                    <div className="flex items-center gap-3">
                      {c.image_url ? (
                        <img src={c.image_url} className="w-10 h-10 rounded-lg object-cover" alt={c.name} />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Image className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{positions.find(p => p.id === c.position_id)?.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setEditingCandidate(c); setEditCandidateOpen(true); }}
                      >
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteCandidate(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Edit Candidate Dialog */}
            <Dialog open={editCandidateOpen} onOpenChange={(open) => { setEditCandidateOpen(open); if (!open) setEditCandidateImage(null); }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Candidate</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Position</Label>
                    <Select 
                      value={editingCandidate?.position_id || ''} 
                      onValueChange={v => setEditingCandidate({ ...editingCandidate, position_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        {positions.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input 
                      value={editingCandidate?.name || ''} 
                      onChange={e => setEditingCandidate({ ...editingCandidate, name: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Manifesto</Label>
                    <Textarea 
                      value={editingCandidate?.manifesto || ''} 
                      onChange={e => setEditingCandidate({ ...editingCandidate, manifesto: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Photo (max 5MB)</Label>
                    {editingCandidate?.image_url && !editCandidateImage && (
                      <div className="mb-2">
                        <img src={editingCandidate.image_url} className="w-20 h-20 rounded-lg object-cover" alt="Current" />
                      </div>
                    )}
                    <input 
                      ref={editFileInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => { 
                        if (e.target.files?.[0] && e.target.files[0].size <= 5242880) {
                          setEditCandidateImage(e.target.files[0]); 
                        } else {
                          toast({ title: 'File too large', variant: 'destructive' }); 
                        }
                      }} 
                    />
                    <Button variant="outline" onClick={() => editFileInputRef.current?.click()} className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      {editCandidateImage ? editCandidateImage.name : 'Change Image'}
                    </Button>
                  </div>
                  <Button onClick={updateCandidate} className="w-full btn-primary-gradient" disabled={uploading}>
                    {uploading ? 'Updating...' : 'Update Candidate'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Voters Tab */}
          <TabsContent value="voters">
            <Card>
              <CardHeader><CardTitle>Registered Voters ({voters.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {voters.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.email} • {v.department} • {v.registration_number}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {positions.map(p => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{p.title}</CardTitle>
                  {!publishedResults.some(r => r.position_id === p.id) && (
                    <Button size="sm" onClick={() => publishResults(p.id)} className="btn-accent-gradient">
                      <Send className="w-4 h-4 mr-1" />Publish
                    </Button>
                  )}
                  {publishedResults.some(r => r.position_id === p.id) && (
                    <span className="text-sm text-success font-medium">✓ Published</span>
                  )}
                </CardHeader>
                <CardContent>
                  <ResultsChart position={p} candidates={candidates.filter(c => c.position_id === p.id)} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
