import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Check, 
  X, 
  MapPin, 
  Clock, 
  Loader2,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HazardReport {
  id: string;
  hazard_type: string;
  description: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: 'pending' | 'verified' | 'resolved' | 'rejected';
  photo_url: string | null;
  created_at: string;
  reporter_id: string;
}

const IncidentFeed = () => {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch initial data
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('hazard_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch incident reports.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('hazard_reports_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hazard_reports',
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new as HazardReport;
            if (filter === 'all' || newReport.status === 'pending') {
              setReports(prev => [newReport, ...prev]);
              toast({
                title: '🚨 New Incident Report',
                description: `${newReport.hazard_type} reported at ${newReport.location}`,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedReport = payload.new as HazardReport;
            setReports(prev => {
              // If filtering by pending and report is no longer pending, remove it
              if (filter === 'pending' && updatedReport.status !== 'pending') {
                return prev.filter(r => r.id !== updatedReport.id);
              }
              // Otherwise update the report
              return prev.map(r => r.id === updatedReport.id ? updatedReport : r);
            });
          } else if (payload.eventType === 'DELETE') {
            setReports(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const handleVerify = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      const { error } = await supabase
        .from('hazard_reports')
        .update({ 
          status: 'verified',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Invalidate queries to refresh admin stats
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['hazardReports'] });

      toast({
        title: '✓ Report Verified',
        description: 'The hazard report has been verified and is now active.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      const { error } = await supabase
        .from('hazard_reports')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['hazardReports'] });

      toast({
        title: 'Report Rejected',
        description: 'The hazard report has been rejected.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case 'verified':
        return <Badge className="bg-green-500/20 text-green-400 border-0">Verified</Badge>;
      case 'resolved':
        return <Badge className="bg-blue-500/20 text-blue-400 border-0">Resolved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getHazardIcon = (type: string) => {
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <Card className="bg-command-muted/30 border-command-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            Incident Feed
            {reports.length > 0 && filter === 'pending' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 animate-pulse">
                {reports.length} pending
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter(f => f === 'pending' ? 'all' : 'pending')}
              className="text-white/60 hover:text-white hover:bg-command-muted text-xs"
            >
              <Filter className="w-3 h-3 mr-1" />
              {filter === 'pending' ? 'Pending' : 'All'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchReports}
              disabled={isLoading}
              className="text-white/60 hover:text-white hover:bg-command-muted h-8 w-8"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ocean" />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className={cn(
                  "p-4 bg-command rounded-xl border transition-all duration-200",
                  report.status === 'pending' 
                    ? "border-yellow-500/30 hover:border-yellow-500/50" 
                    : "border-command-muted hover:border-command-muted/80"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      report.status === 'pending' ? "bg-yellow-500/20" : "bg-command-muted"
                    )}>
                      {getHazardIcon(report.hazard_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm">{report.hazard_type}</span>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/50 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  {report.status === 'pending' && (
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{report.location}</span>
                </div>

                {/* Description */}
                {report.description && (
                  <p className="text-xs text-white/60 mb-3 line-clamp-2">
                    {report.description}
                  </p>
                )}

                {/* Photo preview */}
                {report.photo_url && (
                  <div className="mb-3">
                    <img 
                      src={report.photo_url} 
                      alt="Incident" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Actions - Only show for pending reports */}
                {report.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-command-muted">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9"
                      onClick={() => handleVerify(report.id)}
                      disabled={processingId === report.id}
                    >
                      {processingId === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9"
                      onClick={() => handleReject(report.id)}
                      disabled={processingId === report.id}
                    >
                      {processingId === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/50">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {filter === 'pending' ? 'pending ' : ''}incident reports</p>
            <p className="text-xs mt-1 text-white/30">New reports will appear here in real-time</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IncidentFeed;
