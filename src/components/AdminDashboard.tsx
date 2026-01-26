import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  Building2, 
  Plus, 
  Phone, 
  Map, 
  Check,  
  MapPin, 
  Clock, 
  Loader2, 
  UserCheck,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useUnverifiedUsers, useVerifyUser } from '@/hooks/useUnverifiedUsers';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import HazardModal from './admin/HazardModal';
import IncidentFeed from './admin/IncidentFeed';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: unverifiedUsers, isLoading: usersLoading } = useUnverifiedUsers();
  const verifyUser = useVerifyUser();
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null);
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);

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
      color: 'text-ocean',
      bgColor: 'bg-ocean/10'
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
    <div className="min-h-screen text-white p-4 md:p-6 space-y-6 pb-24 md:pb-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-ocean/10 border border-ocean/20 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Command Center Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">Naval, Biliran DRRM Operations</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-white/70">Real-time monitoring active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-command-muted/30 border-command-muted hover:border-ocean/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/50">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            className="h-auto py-5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-xl"
            onClick={() => setIsHazardModalOpen(true)}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="font-medium text-sm">{t.addHazard}</span>
            </div>
          </Button>
          <Button 
            className="h-auto py-5 bg-ocean hover:bg-ocean/90 text-white border-0 rounded-xl"
            onClick={() => navigate('/admin/centers')}
          >
            <div className="flex flex-col items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span className="font-medium text-sm">{t.addEvacCenter}</span>
            </div>
          </Button>
          <Button 
            variant="outline"
            className="h-auto py-5 bg-command-muted/50 hover:bg-command-muted text-white border-command-muted rounded-xl"
            onClick={() => navigate('/admin/hotlines')}
          >
            <div className="flex flex-col items-center gap-2">
              <Phone className="w-5 h-5" />
              <span className="font-medium text-sm">Hotlines</span>
            </div>
          </Button>
          <Button 
            variant="outline"
            className="h-auto py-5 bg-command-muted/50 hover:bg-command-muted text-white border-command-muted rounded-xl"
            onClick={() => navigate('/admin/map')}
          >
            <div className="flex flex-col items-center gap-2">
              <Map className="w-5 h-5" />
              <span className="font-medium text-sm">Live Map</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Two Column Layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Feed - Real-time with Supabase */}
        <IncidentFeed />

        {/* Pending User Verifications */}
        <Card className="bg-command-muted/30 border-command-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <div className="p-2 bg-ocean/20 rounded-lg">
                  <UserCheck className="w-4 h-4 text-ocean" />
                </div>
                User Verifications
                {unverifiedUsers && unverifiedUsers.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ocean/20 text-ocean">
                    {unverifiedUsers.length}
                  </span>
                )}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/50 hover:text-white hover:bg-command-muted text-xs"
                onClick={() => navigate('/admin/users')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-ocean" />
              </div>
            ) : unverifiedUsers && unverifiedUsers.length > 0 ? (
              <div className="space-y-3">
                {unverifiedUsers.slice(0, 5).map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 bg-command rounded-xl border border-command-muted"
                  >
                    <div className="w-10 h-10 rounded-full bg-ocean/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-ocean">
                        {user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{user.full_name || 'Unknown User'}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50">
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3"
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
              <div className="text-center py-12 text-white/50">
                <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No pending verifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hazard Modal */}
      <HazardModal 
        open={isHazardModalOpen} 
        onClose={() => setIsHazardModalOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
