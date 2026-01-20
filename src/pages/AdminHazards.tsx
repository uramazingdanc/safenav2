import { useState } from 'react';
import { AlertTriangle, MapPin, Clock, Filter, Search, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHazards, useDeleteHazard } from '@/hooks/useHazards';
import { formatDistanceToNow } from 'date-fns';

const AdminHazards = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: hazards, isLoading } = useHazards();
  const deleteHazard = useDeleteHazard();

  const filteredHazards = hazards?.filter(hazard => 
    hazard.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hazard.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeCount = hazards?.filter(h => h.status === 'active').length || 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive animate-pulse';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-accent';
      default: return 'bg-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Hazard Management</h1>
            <p className="text-sm text-muted-foreground">{activeCount} active hazards</p>
          </div>
        </div>
        <Button className="bg-success hover:bg-success/90">
          <Plus className="w-4 h-4 mr-2" />
          {t.addHazard}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search hazards..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Hazards List */}
      <div className="space-y-3">
        {filteredHazards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? 'No hazards found matching your search.' : 'No hazards reported yet.'}
            </CardContent>
          </Card>
        ) : (
          filteredHazards.map((hazard) => (
            <Card key={hazard.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(hazard.severity)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{hazard.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        hazard.status === 'active' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                      }`}>
                        {hazard.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadge(hazard.severity)}`}>
                        {hazard.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {hazard.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(hazard.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => deleteHazard.mutate(hazard.id)}
                      disabled={deleteHazard.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminHazards;
