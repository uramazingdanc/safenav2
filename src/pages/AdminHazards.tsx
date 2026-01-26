import { useState } from 'react';
import { AlertTriangle, MapPin, Clock, Filter, Search, Plus, Loader2, Radio, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtimeHazards, useVerifiedHazards } from '@/hooks/useRealtimeHazards';
import { useDeleteHazard, useUpdateHazard } from '@/hooks/useHazards';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import HazardModal from '@/components/admin/HazardModal';

const AdminHazards = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: allHazards, isLoading: loadingAll } = useRealtimeHazards();
  const { data: verifiedHazards, isLoading: loadingVerified } = useVerifiedHazards();
  const deleteHazard = useDeleteHazard();
  const updateHazard = useUpdateHazard();

  const filteredAllHazards = allHazards?.filter(hazard => 
    hazard.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    hazard.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredVerifiedHazards = verifiedHazards?.filter(hazard =>
    hazard.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hazard.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeCount = allHazards?.filter(h => h.status === 'active').length || 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500 animate-pulse';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/20 text-rose-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-rose-500/20 text-rose-400';
      case 'resolved': return 'bg-emerald-500/20 text-emerald-400';
      case 'monitoring': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateHazard.mutateAsync({ id, status: 'resolved' });
      toast.success('Hazard marked as resolved');
    } catch (error) {
      toast.error('Failed to update hazard');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHazard.mutateAsync(id);
      toast.success('Hazard deleted');
    } catch (error) {
      toast.error('Failed to delete hazard');
    }
  };

  if (loadingAll || loadingVerified) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh] bg-command">
        <Loader2 className="w-8 h-8 animate-spin text-ocean" />
      </div>
    );
  }

  const HazardCard = ({ hazard, showActions = true }: { hazard: any; showActions?: boolean }) => (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(hazard.severity)}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-white">{hazard.type}</span>
              <Badge className={getStatusBadge(hazard.status)}>{hazard.status}</Badge>
              <Badge className={getSeverityBadge(hazard.severity)}>{hazard.severity}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {hazard.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(hazard.created_at), { addSuffix: true })}
              </span>
            </div>
            {hazard.description && (
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{hazard.description}</p>
            )}
          </div>
          {showActions && (
            <div className="flex gap-2">
              {hazard.status === 'active' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                  onClick={() => handleResolve(hazard.id)}
                >
                  Resolve
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="border-rose-600 text-rose-400 hover:bg-rose-600/20"
                onClick={() => handleDelete(hazard.id)}
                disabled={deleteHazard.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in bg-command min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Hazard Management</h1>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              {activeCount} active hazards • Real-time
            </p>
          </div>
        </div>
        <Button className="bg-ocean hover:bg-ocean/90" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t.addHazard}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search hazards..." 
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-ocean">
            All Hazards ({allHazards?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="verified" className="data-[state=active]:bg-ocean">
            <Eye className="w-4 h-4 mr-1" />
            Active/Public ({verifiedHazards?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {filteredAllHazards.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center text-slate-500">
                {searchTerm ? 'No hazards found matching your search.' : 'No hazards reported yet.'}
              </CardContent>
            </Card>
          ) : (
            filteredAllHazards.map(hazard => (
              <HazardCard key={hazard.id} hazard={hazard} />
            ))
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-3 mt-4">
          <Card className="bg-emerald-500/10 border-emerald-500/30 mb-4">
            <CardContent className="p-3">
              <p className="text-sm text-emerald-400">
                <Eye className="w-4 h-4 inline mr-1" />
                These hazards are currently visible to the public on the mobile app.
              </p>
            </CardContent>
          </Card>
          {filteredVerifiedHazards.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center text-slate-500">
                No active hazards to display publicly.
              </CardContent>
            </Card>
          ) : (
            filteredVerifiedHazards.map(hazard => (
              <HazardCard key={hazard.id} hazard={hazard} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <HazardModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminHazards;
