import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  Building2, 
  Plus, 
  Phone, 
  Map, 
  Loader2, 
  Activity,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminStats } from '@/hooks/useAdminStats';
import { usePendingVerifications } from '@/hooks/useVerification';
import HazardModal from './admin/HazardModal';
import IncidentFeed from './admin/IncidentFeed';
import AdminVerificationQueue from './admin/AdminVerificationQueue';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: pendingVerifications } = usePendingVerifications();
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);

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
    { 
      label: 'ID Verifications', 
      value: pendingVerifications?.length?.toString() || '0', 
      icon: Shield, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentFeed />
        <AdminVerificationQueue />
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