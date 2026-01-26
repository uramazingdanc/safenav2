import { useState } from 'react';
import { Building2, MapPin, Users, Phone, Search, Filter, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvacuationCenters } from '@/hooks/useEvacuationCenters';
const AdminEvacCenters = () => {
  const {
    t
  } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const {
    data: centers,
    isLoading
  } = useEvacuationCenters();
  const filteredCenters = centers?.filter(center => center.name.toLowerCase().includes(searchTerm.toLowerCase()) || center.location.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-success/10 text-success';
      case 'full':
        return 'bg-destructive/10 text-destructive';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const getCapacityColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio > 0.9) return 'bg-destructive';
    if (ratio > 0.7) return 'bg-warning';
    return 'bg-success';
  };
  if (isLoading) {
    return <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">Evacuation Centers</h1>
            <p className="text-sm text-muted-foreground">{centers?.length || 0} centers registered</p>
          </div>
        </div>
        <Button className="bg-accent hover:bg-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          {t.addEvacCenter}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search centers..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCenters.length === 0 ? <Card className="md:col-span-2">
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? 'No centers found matching your search.' : 'No evacuation centers registered yet.'}
            </CardContent>
          </Card> : filteredCenters.map(center => <Card key={center.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{center.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {center.location}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(center.status)}`}>
                    {center.status.toUpperCase()}
                  </span>
                </div>
                
                {/* Capacity Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">{center.current_occupancy}/{center.capacity}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${getCapacityColor(center.current_occupancy, center.capacity)}`} style={{
                width: `${Math.min(center.current_occupancy / center.capacity * 100, 100)}%`
              }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="w-3 h-3 mr-1" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>)}
      </div>
    </div>;
};
export default AdminEvacCenters;