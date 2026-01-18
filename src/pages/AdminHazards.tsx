import { AlertTriangle, MapPin, Clock, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminHazards = () => {
  const { t } = useLanguage();

  const hazards = [
    { id: 1, type: 'Flood', location: 'Brgy. San Nicolas', severity: 'high', reported: '2 hours ago', status: 'active' },
    { id: 2, type: 'Landslide', location: 'Mountain View', severity: 'critical', reported: '4 hours ago', status: 'active' },
    { id: 3, type: 'Road Damage', location: 'Capitol Site', severity: 'medium', reported: '1 day ago', status: 'resolved' },
    { id: 4, type: 'Power Lines', location: 'Lahug', severity: 'high', reported: '3 hours ago', status: 'active' },
    { id: 5, type: 'Fire', location: 'Carbon Market', severity: 'critical', reported: '30 min ago', status: 'active' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Hazard Management</h1>
            <p className="text-sm text-muted-foreground">{hazards.filter(h => h.status === 'active').length} active hazards</p>
          </div>
        </div>
        <Button className="bg-success hover:bg-success/90">
          + {t.addHazard}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search hazards..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Hazards List */}
      <div className="space-y-3">
        {hazards.map((hazard) => (
          <Card key={hazard.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${
                  hazard.severity === 'critical' ? 'bg-destructive animate-pulse' :
                  hazard.severity === 'high' ? 'bg-warning' : 'bg-accent'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{hazard.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      hazard.status === 'active' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                    }`}>
                      {hazard.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      hazard.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                      hazard.severity === 'high' ? 'bg-warning text-warning-foreground' : 'bg-accent text-accent-foreground'
                    }`}>
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
                      {hazard.reported}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminHazards;
