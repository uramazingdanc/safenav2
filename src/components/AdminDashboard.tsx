import { useState } from 'react';
import { Users, AlertTriangle, Building2, Plus, TrendingUp, Clock, MapPin, FileText, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import VideoManualModal from './VideoManualModal';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [showGuide, setShowGuide] = useState(false);

  const stats = [
    { label: t.totalUsers, value: '12,458', icon: Users, change: '+12%', color: 'text-accent' },
    { label: t.totalHazards, value: '47', icon: AlertTriangle, change: '+3', color: 'text-destructive' },
    { label: 'Evac Centers', value: '23', icon: Building2, change: '0', color: 'text-success' },
    { label: 'Active Alerts', value: '8', icon: Clock, change: '-2', color: 'text-warning' },
  ];

  const recentReports = [
    { id: 1, type: 'Flood', location: 'Brgy. San Nicolas', time: '10 min ago', status: 'pending' },
    { id: 2, type: 'Road Block', location: 'Capitol Site', time: '25 min ago', status: 'verified' },
    { id: 3, type: 'Landslide', location: 'Mountain View', time: '1 hour ago', status: 'resolved' },
    { id: 4, type: 'Power Outage', location: 'Lahug', time: '2 hours ago', status: 'pending' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard}</h1>
          <p className="text-muted-foreground">Welcome back, Admin</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowGuide(true)}
            className="hidden md:flex"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {t.systemGuide}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-success' : stat.change.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button className="h-auto py-4 bg-success hover:bg-success/90">
          <div className="flex flex-col items-center gap-2">
            <Plus className="w-6 h-6" />
            <span>{t.addHazard}</span>
          </div>
        </Button>
        <Button className="h-auto py-4 bg-accent hover:bg-accent/90">
          <div className="flex flex-col items-center gap-2">
            <Building2 className="w-6 h-6" />
            <span>{t.addEvacCenter}</span>
          </div>
        </Button>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Reports
            </CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
              >
                <div className={`w-2 h-2 rounded-full ${
                  report.status === 'pending' ? 'bg-warning' :
                  report.status === 'verified' ? 'bg-success' : 'bg-muted-foreground'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{report.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      report.status === 'pending' ? 'bg-warning/20 text-warning' :
                      report.status === 'verified' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {report.location}
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    {report.time}
                  </div>
                </div>
                <Button variant="outline" size="sm">Review</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart Placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground">Activity chart will appear here</p>
          </div>
        </CardContent>
      </Card>

      <VideoManualModal open={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
};

export default AdminDashboard;
