import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Building2, Plus, Phone, Map, Check, X, MapPin, Clock, Loader2, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminStats } from '@/hooks/useAdminStats';
import { usePendingReports, useUpdateHazardReport } from '@/hooks/useHazardReports';
import { useUnverifiedUsers, useVerifyUser } from '@/hooks/useUnverifiedUsers';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import HazardModal from './admin/HazardModal';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: pendingReports, isLoading: reportsLoading } = usePendingReports();
  const { data: unverifiedUsers, isLoading: usersLoading } = useUnverifiedUsers();
  const updateReport = useUpdateHazardReport();
  const verifyUser = useVerifyUser();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null);
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);

  const handleVerify = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      await updateReport.mutateAsync({ id: reportId, status: 'verified' });
      toast({
        title: 'Report Verified',
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
      await updateReport.mutateAsync({ id: reportId, status: 'rejected' });
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

  const handleVerifyUser = async (userId: string) => {
    setVerifyingUserId(userId);
    try {
      await verifyUser.mutateAsync(userId);
      toast({
        title: 'User Verified',
        description: 'The user has been verified successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingUserId(null);
    }
  };

  const statCards = [
    { 
      label: t.totalUsers, 
      value: statsLoading ? '...' : stats?.totalUsers?.toString() || '0', 
      icon: Users, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: t.totalHazards, 
      value: statsLoading ? '...' : stats?.totalHazards?.toString() || '0', 
      icon: AlertTriangle, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    { 
      label: 'Evac Centers', 
      value: statsLoading ? '...' : stats?.totalEvacCenters?.toString() || '0', 
      icon: Building2, 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      {/* Stats Grid - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
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

      {/* Quick Actions - 2x2 Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="h-auto py-6 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            onClick={() => setIsHazardModalOpen(true)}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="w-6 h-6" />
              <span className="font-semibold">{t.addHazard}</span>
            </div>
          </Button>
          <Button 
            className="h-auto py-6 bg-blue-600 hover:bg-blue-700 text-white border-0"
            onClick={() => navigate('/admin/centers')}
          >
            <div className="flex flex-col items-center gap-2">
              <Building2 className="w-6 h-6" />
              <span className="font-semibold">{t.addEvacCenter}</span>
            </div>
          </Button>
          <Button 
            variant="outline"
            className="h-auto py-6 bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600"
            onClick={() => navigate('/admin/hotlines')}
          >
            <div className="flex flex-col items-center gap-2">
              <Phone className="w-6 h-6" />
              <span className="font-semibold">Hotlines</span>
            </div>
          </Button>
          <Button 
            variant="outline"
            className="h-auto py-6 bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600"
            onClick={() => navigate('/admin/map')}
          >
            <div className="flex flex-col items-center gap-2">
              <Map className="w-6 h-6" />
              <span className="font-semibold">Live Map View</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Pending User Verifications */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <UserCheck className="w-5 h-5 text-blue-400" />
              Pending User Verifications
              {unverifiedUsers && unverifiedUsers.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  {unverifiedUsers.length}
                </span>
              )}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white"
              onClick={() => navigate('/admin/users')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : unverifiedUsers && unverifiedUsers.length > 0 ? (
            <div className="space-y-3">
              {unverifiedUsers.slice(0, 5).map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-400">
                      {user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{user.full_name || 'Unknown User'}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      {user.barangay && (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{user.barangay}</span>
                          <span>•</span>
                        </>
                      )}
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleVerifyUser(user.user_id)}
                    disabled={verifyingUserId === user.user_id}
                  >
                    {verifyingUserId === user.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pending verifications</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Hazard Reports */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Pending Hazard Reports
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white"
              onClick={() => navigate('/admin/reports')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : pendingReports && pendingReports.length > 0 ? (
            <div className="space-y-3">
              {pendingReports.slice(0, 5).map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{report.hazard_type}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        pending
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{report.location}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="flex-shrink-0">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 w-9 p-0"
                      onClick={() => handleVerify(report.id)}
                      disabled={processingId === report.id}
                    >
                      {processingId === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-rose-600 hover:bg-rose-700 text-white h-9 w-9 p-0"
                      onClick={() => handleReject(report.id)}
                      disabled={processingId === report.id}
                    >
                      {processingId === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pending reports</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hazard Modal */}
      <HazardModal 
        open={isHazardModalOpen} 
        onClose={() => setIsHazardModalOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
