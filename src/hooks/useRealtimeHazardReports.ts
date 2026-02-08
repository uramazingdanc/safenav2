import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type HazardReport = Tables<'hazard_reports'>;
type HazardReportUpdate = TablesUpdate<'hazard_reports'>;

export interface ReportWithReporter extends HazardReport {
  reporter_name?: string;
  reporter_barangay?: string;
}

export const useRealtimeHazardReports = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const query = useQuery({
    queryKey: ['hazard_reports', 'realtime'],
    queryFn: async () => {
      // Fetch reports
      const { data: reports, error } = await supabase
        .from('hazard_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reporter profiles separately
      const reporterIds = [...new Set(reports?.map(r => r.reporter_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, barangay')
        .in('user_id', reporterIds);

      // Merge reports with reporter info
      const reportsWithReporter: ReportWithReporter[] = (reports || []).map(report => {
        const reporter = profiles?.find(p => p.user_id === report.reporter_id);
        return {
          ...report,
          reporter_name: reporter?.full_name || 'Unknown',
          reporter_barangay: reporter?.barangay || ''
        };
      });

      return reportsWithReporter;
    }
  });

  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('hazard_reports_realtime_page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hazard_reports'
        },
        (payload) => {
          console.log('Hazard report change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['hazard_reports', 'realtime'] });
          queryClient.invalidateQueries({ queryKey: ['hazard_reports'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, isSubscribed]);

  return query;
};

export const usePendingReports = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const query = useQuery({
    queryKey: ['hazard_reports', 'pending'],
    queryFn: async () => {
      const { data: reports, error } = await supabase
        .from('hazard_reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch reporter profiles
      const reporterIds = [...new Set(reports?.map(r => r.reporter_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, barangay')
        .in('user_id', reporterIds);

      const reportsWithReporter: ReportWithReporter[] = (reports || []).map(report => {
        const reporter = profiles?.find(p => p.user_id === report.reporter_id);
        return {
          ...report,
          reporter_name: reporter?.full_name || 'Unknown',
          reporter_barangay: reporter?.barangay || ''
        };
      });

      return reportsWithReporter;
    }
  });

  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('pending_reports_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hazard_reports'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hazard_reports', 'pending'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, isSubscribed]);

  return query;
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: HazardReportUpdate & { id: string }) => {
      // Update the report status
      const { data: updatedReport, error } = await supabase
        .from('hazard_reports')
        .update({
          ...updates,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If the report is being verified, also create a hazard entry
      if (updates.status === 'verified' && updatedReport) {
        const { error: hazardError } = await supabase
          .from('hazards')
          .insert({
            type: updatedReport.hazard_type,
            severity: 'medium', // Default severity for user reports
            location: updatedReport.location,
            description: updatedReport.description,
            latitude: updatedReport.latitude,
            longitude: updatedReport.longitude,
            photo_url: updatedReport.photo_url,
            status: 'active',
          });

        if (hazardError) {
          console.error('Failed to create hazard from verified report:', hazardError);
          // Don't throw - the report was still verified successfully
        }
      }

      return updatedReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazard_reports'] });
      queryClient.invalidateQueries({ queryKey: ['hazards'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
    }
  });
};
