import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  Building2, 
  Plus, 
  Map, 
  Phone, 
  Check, 
  X, 
  LogOut,
  BookOpen,
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingReports, useUpdateHazardReport } from '@/hooks/useHazardReports';
import { useAllProfiles } from '@/hooks/useProfiles';
import { useHazards } from '@/hooks/useHazards';
import { useEvacuationCenters } from '@/hooks/useEvacuationCenters';
import VideoManualModal from './VideoManualModal';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showGuide, setShowGuide] = useState(false);

  // Fetch real data
  const { data: profiles } = useAllProfiles();
  const { data: hazards } = useHazards();
  const { data: evacCenters } = useEvacuationCenters();
  const { data: pendingReports } = usePendingReports();
  const updateReport = useUpdateHazardReport();

  const stats = [
    { 
      label: t.totalUsers, 
      value: profiles?.length?.toLocaleString() || '0', 
      icon: Users, 
      color: 'bg-blue-500',
      iconColor: 'text-blue-400'
    },
    { 
      label: t.totalHazards, 
      value: hazards?.length?.toString() || '0', 
      icon: AlertTriangle, 
      color: 'bg-orange-500',
      iconColor: 'text-orange-400'
    },
    { 
      label: 'Evac Centers', 
      value: evacCenters?.length?.toString() || '0', 
      icon: Building2, 
      color: 'bg-green-500',
      iconColor: 'text-green-400'
    },
  ];

  const handleVerify = async (reportId: string) => {
    try {
      await updateReport.mutateAsync({ id: reportId, status: 'verified' });
      toast({ title: 'Report Verified', description: 'The hazard report has been verified.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to verify report.', variant: 'destructive' });
    }
  };

  const handleReject = async (reportId: string) => {
    try {
      await updateReport.mutateAsync({ id: reportId, status: 'rejected' });
      toast({ title: 'Report Rejected', description: 'The hazard report has been rejected.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to reject report.', variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0D253F] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SafeNav Admin</h1>
              <p className="text-sm text-slate-400">Disaster Risk Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-600 text-white hover:bg-green-600">Admin</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuide(true)}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              System Manual
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card 
              key={stat.label} 
              className="bg-slate-800/50 border-slate-700"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} bg-opacity-20 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            className="h-24 flex-col gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => navigate('/admin/hazards')}
          >
            <Plus className="w-8 h-8" />
            <span className="font-semibold">{t.addHazard}</span>
          </Button>
          <Button 
            className="h-24 flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate('/admin/centers')}
          >
            <Building2 className="w-8 h-8" />
            <span className="font-semibold">{t.addEvacCenter}</span>
          </Button>
          <Button 
            className="h-24 flex-col gap-2 bg-slate-600 hover:bg-slate-500 text-white"
            onClick={() => toast({ title: 'Hotlines', description: 'Hotlines management coming soon!' })}
          >
            <Phone className="w-8 h-8" />
            <span className="font-semibold">Hotlines</span>
          </Button>
          <Button 
            className="h-24 flex-col gap-2 bg-slate-600 hover:bg-slate-500 text-white"
            onClick={() => navigate('/map')}
          >
            <Map className="w-8 h-8" />
            <span className="font-semibold">Live Map View</span>
          </Button>
        </div>

        {/* Pending Reports */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Pending Hazard Reports
              {pendingReports && pendingReports.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingReports.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingReports || pendingReports.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending reports to review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white capitalize">{report.hazard_type}</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">
                          Pending
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.location || 'Unknown location'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-slate-300 mt-2 line-clamp-2">{report.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerify(report.id)}
                        disabled={updateReport.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(report.id)}
                        disabled={updateReport.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <VideoManualModal open={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
};

export default AdminDashboard;
