import { useState } from 'react';
import { FileText, Search, Filter, Eye, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, Image } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHazardReports, useUpdateHazardReport } from '@/hooks/useHazardReports';
import { MOCK_REPORTS, MockReport, getSeverityColors, getStatusColors } from '@/data/mockAdminData';
import { formatDistanceToNow } from 'date-fns';

const AdminReports = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<MockReport | null>(null);
  const { data: dbReports } = useHazardReports();
  const updateReport = useUpdateHazardReport();

  // Use mock data if database is empty
  const reports: MockReport[] = dbReports?.length
    ? dbReports.map((r: any) => ({
        id: r.id,
        hazard_type: r.hazard_type,
        location: r.location,
        description: r.description || '',
        severity: r.severity || 'medium',
        status: r.status,
        photo_url: r.photo_url,
        reporter_name: r.profiles?.full_name || 'Unknown',
        reporter_barangay: r.profiles?.barangay || '',
        ai_confidence: Math.floor(70 + Math.random() * 30),
        created_at: r.created_at,
        latitude: r.latitude || 0,
        longitude: r.longitude || 0,
      }))
    : MOCK_REPORTS;

  const filteredReports = reports.filter(report =>
    report.hazard_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingReports = filteredReports.filter(r => r.status === 'pending');
  const processedReports = filteredReports.filter(r => r.status !== 'pending');

  const handleVerify = async (id: string) => {
    await updateReport.mutateAsync({ id, status: 'verified' });
    if (selectedReport?.id === id) {
      setSelectedReport(prev => prev ? { ...prev, status: 'verified' } : null);
    }
  };

  const handleReject = async (id: string) => {
    await updateReport.mutateAsync({ id, status: 'rejected' });
    if (selectedReport?.id === id) {
      setSelectedReport(prev => prev ? { ...prev, status: 'rejected' } : null);
    }
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 animate-fade-in bg-[#0f172a] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t.viewReports}</h1>
            <p className="text-sm text-slate-400">{pendingReports.length} pending verification</p>
          </div>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search reports..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
        {/* Left: Reports List */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Incoming Reports</h2>
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="space-y-3 pr-4">
              {pendingReports.length === 0 && processedReports.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-8 text-center text-slate-500">
                    No reports submitted yet.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Pending Reports */}
                  {pendingReports.map((report) => {
                    const severityColors = getSeverityColors(report.severity);
                    const isSelected = selectedReport?.id === report.id;

                    return (
                      <Card
                        key={report.id}
                        className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:border-slate-600 ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${severityColors.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-white">{report.hazard_type}</span>
                                <Badge className={`${severityColors.bg} ${severityColors.text} border-0 text-xs`}>
                                  {report.severity}
                                </Badge>
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                                  pending
                                </Badge>
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

                  {/* Processed Reports */}
                  {processedReports.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-4">
                        Processed
                      </h3>
                      {processedReports.slice(0, 5).map((report) => {
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
            <Card className="bg-slate-800/50 border-slate-700 h-[calc(100vh-340px)] overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${getSeverityColors(selectedReport.severity).text}`} />
                      <h3 className="text-xl font-bold text-white">{selectedReport.hazard_type}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSeverityColors(selectedReport.severity).bg} ${getSeverityColors(selectedReport.severity).text} border-0`}>
                        {selectedReport.severity}
                      </Badge>
                      <Badge className={`${getStatusColors(selectedReport.status).bg} ${getStatusColors(selectedReport.status).text} border-0`}>
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Evidence Photo Placeholder */}
                <div className="bg-slate-900/50 rounded-lg p-8 text-center border border-dashed border-slate-700">
                  <Image className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-500 text-sm">
                    {selectedReport.photo_url ? 'Photo evidence available' : 'No photo attached'}
                  </p>
                </div>

                {/* Details */}
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
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-slate-300">{selectedReport.description}</p>
                  </div>
                )}

                {/* AI Analysis */}
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <p className="text-xs text-blue-400 font-semibold mb-1">AI Analysis Confidence</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${selectedReport.ai_confidence}%` }}
                      />
                    </div>
                    <span className="text-blue-400 font-bold">{selectedReport.ai_confidence}%</span>
                  </div>
                </div>

                {/* Actions */}
                {selectedReport.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleVerify(selectedReport.id)}
                      disabled={updateReport.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Publish
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-rose-600 text-rose-400 hover:bg-rose-600/10"
                      onClick={() => handleReject(selectedReport.id)}
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
            <Card className="bg-slate-800/30 border-slate-700 border-dashed h-[calc(100vh-340px)] flex items-center justify-center">
              <CardContent className="text-center text-slate-500">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a report to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
