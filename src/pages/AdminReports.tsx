import { useState } from 'react';
import { FileText, Search, Filter, Eye, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, Radio, Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtimeHazardReports, useUpdateReport, ReportWithReporter } from '@/hooks/useRealtimeHazardReports';
import { usePendingVerifications, useVerificationImages, useReviewVerification } from '@/hooks/useVerification';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const getSeverityColors = (severity: string) => {
  switch (severity) {
    case 'critical': return { dot: 'bg-rose-500 animate-pulse', bg: 'bg-rose-500/20', text: 'text-rose-400' };
    case 'high': return { dot: 'bg-orange-500', bg: 'bg-orange-500/20', text: 'text-orange-400' };
    case 'medium': return { dot: 'bg-amber-500', bg: 'bg-amber-500/20', text: 'text-amber-400' };
    default: return { dot: 'bg-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
  }
};

const getStatusColors = (status: string) => {
  switch (status) {
    case 'verified': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
    case 'rejected': return { bg: 'bg-rose-500/20', text: 'text-rose-400' };
    case 'resolved': return { bg: 'bg-slate-500/20', text: 'text-slate-400' };
    default: return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
  }
};

const AdminReports = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportWithReporter | null>(null);
  const [activeTab, setActiveTab] = useState('hazards');
  
  const { data: reports, isLoading: reportsLoading } = useRealtimeHazardReports();
  const { data: pendingVerifications, isLoading: verificationsLoading } = usePendingVerifications();
  const updateReport = useUpdateReport();
  const reviewVerification = useReviewVerification();

  const filteredReports = reports?.filter(report =>
    report.hazard_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const pendingReports = filteredReports.filter(r => r.status === 'pending');
  const processedReports = filteredReports.filter(r => r.status !== 'pending');

  const handleVerifyReport = async (id: string) => {
    try {
      await updateReport.mutateAsync({ id, status: 'verified' });
      toast.success('Report verified and published');
      if (selectedReport?.id === id) {
        setSelectedReport(prev => prev ? { ...prev, status: 'verified' } : null);
      }
    } catch (error) {
      toast.error('Failed to verify report');
    }
  };

  const handleRejectReport = async (id: string) => {
    try {
      await updateReport.mutateAsync({ id, status: 'rejected' });
      toast.success('Report rejected');
      if (selectedReport?.id === id) {
        setSelectedReport(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
    } catch (error) {
      toast.error('Failed to reject report');
    }
  };

  const handleApproveVerification = async (userId: string) => {
    try {
      await reviewVerification.mutateAsync({ userId, approved: true });
      toast.success('User verification approved');
    } catch (error) {
      toast.error('Failed to approve verification');
    }
  };

  const handleRejectVerification = async (userId: string) => {
    try {
      await reviewVerification.mutateAsync({ userId, approved: false, adminNotes: 'Verification rejected' });
      toast.success('User verification rejected');
    } catch (error) {
      toast.error('Failed to reject verification');
    }
  };

  const isLoading = reportsLoading || verificationsLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh] bg-command">
        <Loader2 className="w-8 h-8 animate-spin text-ocean" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 animate-fade-in bg-command min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t.viewReports}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              {pendingReports.length} hazard reports • {pendingVerifications?.length || 0} ID verifications
            </p>
          </div>
        </div>
      </div>

      {/* Tabs for Hazard Reports and ID Verifications */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="hazards" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Hazard Reports ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="verifications" className="data-[state=active]:bg-ocean/20 data-[state=active]:text-ocean">
            <Shield className="w-4 h-4 mr-2" />
            ID Verifications ({pendingVerifications?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Hazard Reports Tab */}
        <TabsContent value="hazards" className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search reports..."
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Split View Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-350px)]">
            {/* Left: Reports List */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Incoming Reports ({reports?.length || 0})
              </h2>
              <ScrollArea className="h-[calc(100vh-410px)]">
                <div className="space-y-3 pr-4">
                  {filteredReports.length === 0 ? (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-8 text-center text-slate-500">
                        {searchTerm ? 'No reports found matching your search.' : 'No reports submitted yet.'}
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {pendingReports.length > 0 && (
                        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                          Pending Review ({pendingReports.length})
                        </h3>
                      )}
                      {pendingReports.map((report) => {
                        const isSelected = selectedReport?.id === report.id;
                        return (
                          <Card
                            key={report.id}
                            className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:border-slate-600 ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
                            onClick={() => setSelectedReport(report)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full mt-2 bg-amber-500 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold text-white">{report.hazard_type}</span>
                                    <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">pending</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{report.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span>by {report.reporter_name}</span>
                                    <span>•</span>
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {processedReports.length > 0 && (
                        <>
                          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-4">
                            Processed ({processedReports.length})
                          </h3>
                          {processedReports.slice(0, 10).map((report) => {
                            const statusColors = getStatusColors(report.status);
                            const isSelected = selectedReport?.id === report.id;
                            return (
                              <Card
                                key={report.id}
                                className={`bg-slate-900/50 border-slate-800 cursor-pointer transition-all hover:border-slate-700 opacity-70 ${isSelected ? 'ring-2 ring-slate-500' : ''}`}
                                onClick={() => setSelectedReport(report)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-slate-400">{report.hazard_type}</span>
                                    <Badge className={`${statusColors.bg} ${statusColors.text} border-0 text-xs`}>
                                      {report.status}
                                    </Badge>
                                    <span className="text-xs text-slate-500 ml-auto">
                                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Report Details */}
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Report Details</h2>
              {selectedReport ? (
                <Card className="bg-slate-800/50 border-slate-700 h-[calc(100vh-410px)] overflow-auto">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          <h3 className="text-xl font-bold text-white">{selectedReport.hazard_type}</h3>
                        </div>
                        <Badge className={`${getStatusColors(selectedReport.status).bg} ${getStatusColors(selectedReport.status).text} border-0`}>
                          {selectedReport.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>{selectedReport.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>{formatDistanceToNow(new Date(selectedReport.created_at), { addSuffix: true })}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        <span className="text-slate-500">Reported by:</span> {selectedReport.reporter_name}
                        {selectedReport.reporter_barangay && ` (${selectedReport.reporter_barangay})`}
                      </div>
                      {selectedReport.latitude && selectedReport.longitude && (
                        <div className="text-xs text-slate-500">
                          Coords: {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>

                    {selectedReport.description && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-sm text-slate-300">{selectedReport.description}</p>
                      </div>
                    )}

                    {selectedReport.status === 'pending' && (
                      <div className="flex gap-3 pt-4">
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleVerifyReport(selectedReport.id)}
                          disabled={updateReport.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-rose-600 text-rose-400 hover:bg-rose-600/10"
                          onClick={() => handleRejectReport(selectedReport.id)}
                          disabled={updateReport.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-800/30 border-slate-700 border-dashed h-[calc(100vh-410px)] flex items-center justify-center">
                  <CardContent className="text-center text-slate-500">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a report to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ID Verifications Tab */}
        <TabsContent value="verifications" className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Pending ID Verifications ({pendingVerifications?.length || 0})
          </h2>
          
          {!pendingVerifications?.length ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending verification requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingVerifications.map((user) => (
                <VerificationCard 
                  key={user.id} 
                  user={user}
                  onApprove={() => handleApproveVerification(user.user_id)}
                  onReject={() => handleRejectVerification(user.user_id)}
                  isProcessing={reviewVerification.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Verification Card Component
interface VerificationCardProps {
  user: any;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

const VerificationCard = ({ user, onApprove, onReject, isProcessing }: VerificationCardProps) => {
  const { data: images, isLoading } = useVerificationImages(user.id_image_url, user.selfie_image_url);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-ocean" />
          {user.full_name}
        </CardTitle>
        <p className="text-xs text-slate-400">
          {user.barangay || 'No barangay'} • {user.phone_number || 'No phone'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Side by side images */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 rounded-lg p-2 text-center min-h-[100px] flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            ) : images?.idUrl ? (
              <img src={images.idUrl} alt="ID" className="max-h-[80px] rounded object-contain" />
            ) : (
              <span className="text-xs text-slate-500">No ID</span>
            )}
          </div>
          <div className="bg-slate-900 rounded-lg p-2 text-center min-h-[100px] flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            ) : images?.selfieUrl ? (
              <img src={images.selfieUrl} alt="Selfie" className="max-h-[80px] rounded object-contain" />
            ) : (
              <span className="text-xs text-slate-500">No Selfie</span>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500 text-center">
          Submitted {user.verification_submitted_at 
            ? formatDistanceToNow(new Date(user.verification_submitted_at), { addSuffix: true })
            : 'recently'}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={onApprove}
            disabled={isProcessing}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-rose-600 text-rose-400 hover:bg-rose-600/10"
            onClick={onReject}
            disabled={isProcessing}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminReports;
