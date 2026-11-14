import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Airport, AppConfig, Faq, Vehicle } from '@/types';

const HOUR = 60 * 60 * 1000;

export const useAppConfig = () =>
  useQuery<AppConfig>({
    queryKey: ['config'],
    queryFn: api.config,
    staleTime: Infinity,
  });

export const useAirports = () =>
  useQuery<Airport[]>({
    queryKey: ['airports'],
    queryFn: () => api.airports(),
    staleTime: HOUR,
  });

export const useVehicles = () =>
  useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: api.vehicles,
    staleTime: HOUR,
  });

export const useFaqs = () =>
  useQuery<Faq[]>({
    queryKey: ['faqs'],
    queryFn: api.faqs,
    staleTime: HOUR,
  });
