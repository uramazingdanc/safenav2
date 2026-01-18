import { Building2, MapPin, Users, Phone, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminEvacCenters = () => {
  const { t } = useLanguage();

  const centers = [
    { id: 1, name: 'City Hall Gymnasium', location: 'Osmena Blvd', capacity: 500, current: 120, status: 'open' },
    { id: 2, name: 'ABC School Auditorium', location: 'Mabini St', capacity: 300, current: 45, status: 'open' },
    { id: 3, name: 'Brgy. Hall San Nicolas', location: 'San Nicolas', capacity: 150, current: 150, status: 'full' },
    { id: 4, name: 'Sports Complex', location: 'Capitol Grounds', capacity: 1000, current: 0, status: 'standby' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Evacuation Centers</h1>
            <p className="text-sm text-muted-foreground">{centers.length} centers registered</p>
          </div>
        </div>
        <Button className="bg-accent hover:bg-accent/90">
          + {t.addEvacCenter}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search centers..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {centers.map((center) => (
          <Card key={center.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{center.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {center.location}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  center.status === 'open' ? 'bg-success/10 text-success' :
                  center.status === 'full' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                }`}>
                  {center.status.toUpperCase()}
                </span>
              </div>
              
              {/* Capacity Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{center.current}/{center.capacity}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      center.current / center.capacity > 0.9 ? 'bg-destructive' :
                      center.current / center.capacity > 0.7 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${(center.current / center.capacity) * 100}%` }}
                  />
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
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminEvacCenters;
