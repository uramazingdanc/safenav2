import { FileText, Search, Filter, Eye, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminReports = () => {
  const { t } = useLanguage();

  const reports = [
    { id: 1, type: 'Flood', reporter: 'Juan D.', location: 'San Nicolas', time: '10 min ago', status: 'pending' },
    { id: 2, type: 'Road Block', reporter: 'Maria S.', location: 'Capitol Site', time: '25 min ago', status: 'verified' },
    { id: 3, type: 'Landslide', reporter: 'Pedro G.', location: 'Mountain View', time: '1 hour ago', status: 'resolved' },
    { id: 4, type: 'Power Outage', reporter: 'Ana R.', location: 'Lahug', time: '2 hours ago', status: 'pending' },
    { id: 5, type: 'Fire', reporter: 'Jose C.', location: 'Carbon', time: '3 hours ago', status: 'verified' },
    { id: 6, type: 'Structural', reporter: 'Luis M.', location: 'Colon St', time: '5 hours ago', status: 'rejected' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.viewReports}</h1>
            <p className="text-sm text-muted-foreground">{reports.filter(r => r.status === 'pending').length} pending review</p>
          </div>
        </div>
        <Button variant="outline">Export CSV</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search reports..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  report.status === 'pending' ? 'bg-warning/10' :
                  report.status === 'verified' ? 'bg-success/10' :
                  report.status === 'resolved' ? 'bg-muted' : 'bg-destructive/10'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    report.status === 'pending' ? 'text-warning' :
                    report.status === 'verified' ? 'text-success' :
                    report.status === 'resolved' ? 'text-muted-foreground' : 'text-destructive'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{report.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      report.status === 'pending' ? 'bg-warning/10 text-warning' :
                      report.status === 'verified' ? 'bg-success/10 text-success' :
                      report.status === 'resolved' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>by {report.reporter}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.time}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
