'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { reportService } from '../services/reportService';
import { ReportSummary } from '../lib/types';

export function useReports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await reportService.summary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading report summary', error);
      toast.error('Error al cargar reportes');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const dependencias = summary?.dependencias || [];
  const areas = summary?.areas || [];
  const offices = summary?.offices || [];
  const devices = summary?.devices || [];
  const deviceTypes = summary?.deviceTypes || [];
  const clasificaciones = summary?.clasificaciones || [];

  return {
    summary,
    dependencias,
    areas,
    offices,
    devices,
    deviceTypes,
    clasificaciones,
    loading,
    reload: loadSummary,
    totals: summary?.totals || null,
  };
}
