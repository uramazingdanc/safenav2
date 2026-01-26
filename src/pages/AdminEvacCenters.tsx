import { useState } from 'react';
import { Building2, MapPin, Users, Phone, Search, Filter, Plus, Loader2, Radio, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtimeEvacuationCenters, useDeleteEvacCenter } from '@/hooks/useRealtimeEvacuationCenters';
import EvacCenterModal from '@/components/admin/EvacCenterModal';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type EvacuationCenter = Tables<'evacuation_centers'>;

const AdminEvacCenters = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCenter, setEditCenter] = useState<EvacuationCenter | null>(null);
  
  const { data: centers, isLoading } = useRealtimeEvacuationCenters();
  const deleteCenter = useDeleteEvacCenter();

  const filteredCenters = centers?.filter(center => 
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    center.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-500/20 text-emerald-400';
      case 'full': return 'bg-rose-500/20 text-rose-400';
      case 'standby': return 'bg-amber-500/20 text-amber-400';
      case 'closed': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio > 0.9) return 'bg-rose-500';
    if (ratio > 0.7) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleEdit = (center: EvacuationCenter) => {
    setEditCenter(center);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCenter.mutateAsync(id);
      toast.success('Evacuation center deleted');
    } catch (error) {
      toast.error('Failed to delete center');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditCenter(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh] bg-command">
        <Loader2 className="w-8 h-8 animate-spin text-ocean" />
      </div>
    );
  }

  const openCount = centers?.filter(c => c.status === 'open').length || 0;
  const totalCapacity = centers?.reduce((sum, c) => sum + c.capacity, 0) || 0;
  const totalOccupancy = centers?.reduce((sum, c) => sum + c.current_occupancy, 0) || 0;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in bg-command min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Evacuation Centers</h1>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              {centers?.length || 0} centers • {openCount} open • Real-time
            </p>
          </div>
        </div>
        <Button className="bg-ocean hover:bg-ocean/90" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t.addEvacCenter}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{centers?.length || 0}</p>
            <p className="text-xs text-slate-400">Total Centers</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{openCount}</p>
            <p className="text-xs text-slate-400">Currently Open</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-ocean">{totalOccupancy}/{totalCapacity}</p>
            <p className="text-xs text-slate-400">Occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search centers..." 
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

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCenters.length === 0 ? (
          <Card className="md:col-span-2 bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center text-slate-500">
              {searchTerm ? 'No centers found matching your search.' : 'No evacuation centers registered yet.'}
            </CardContent>
          </Card>
        ) : (
          filteredCenters.map(center => (
            <Card key={center.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{center.name}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {center.location}
                    </p>
                  </div>
                  <Badge className={getStatusColor(center.status)}>
                    {center.status.toUpperCase()}
                  </Badge>
                </div>
                
                {/* Capacity Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Capacity</span>
                    <span className="font-medium text-white">{center.current_occupancy}/{center.capacity}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getCapacityColor(center.current_occupancy, center.capacity)}`} 
                      style={{ width: `${Math.min(center.current_occupancy / center.capacity * 100, 100)}%` }} 
                    />
                  </div>
                </div>

                {center.contact_number && (
                  <p className="text-sm text-slate-400 mb-3 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {center.contact_number}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => handleEdit(center)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-rose-600 text-rose-400 hover:bg-rose-600/20"
                    onClick={() => handleDelete(center.id)}
                    disabled={deleteCenter.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EvacCenterModal 
        open={isModalOpen} 
        onClose={handleModalClose}
        editCenter={editCenter}
      />
    </div>
  );
};

export default AdminEvacCenters;
