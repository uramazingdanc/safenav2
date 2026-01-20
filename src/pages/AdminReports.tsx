import { useState } from 'react';
import { FileText, Search, Filter, Eye, Clock, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHazardReports, useUpdateHazardReport } from '@/hooks/useHazardReports';
import { formatDistanceToNow } from 'date-fns';

const AdminReports = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: reports, isLoading } = useHazardReports();
  const updateReport = useUpdateHazardReport();

  const filteredReports = reports?.filter(report => 
    report.hazard_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const pendingCount = reports?.filter(r => r.status === 'pending').length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-warning/10', text: 'text-warning', icon: 'text-warning' };
      case 'verified': return { bg: 'bg-success/10', text: 'text-success', icon: 'text-success' };
      case 'resolved': return { bg: 'bg-muted', text: 'text-muted-foreground', icon: 'text-muted-foreground' };
      case 'rejected': return { bg: 'bg-destructive/10', text: 'text-destructive', icon: 'text-destructive' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', icon: 'text-muted-foreground' };
    }
  };

  const handleVerify = (id: string) => {
    updateReport.mutate({ id, status: 'verified' });
  };

  const handleReject = (id: string) => {
    updateReport.mutate({ id, status: 'rejected' });
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
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.viewReports}</h1>
            <p className="text-sm text-muted-foreground">{pendingCount} pending review</p>
          </div>
        </div>
        <Button variant="outline">Export CSV</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search reports..." 
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

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? 'No reports found matching your search.' : 'No reports submitted yet.'}
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const statusColors = getStatusColor(report.status);
            const reporterName = (report as any).profiles?.full_name || 'Unknown User';
            
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors.bg}`}>
                      <FileText className={`w-5 h-5 ${statusColors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{report.hazard_type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>by {reporterName}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-success"
                            onClick={() => handleVerify(report.id)}
                            disabled={updateReport.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleReject(report.id)}
                            disabled={updateReport.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminReports;
