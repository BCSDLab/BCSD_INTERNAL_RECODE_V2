import { apiClient } from '@/api/client';
import type { PositionResponse } from './types';

export function listPositions() {
  return apiClient.get<PositionResponse[]>('/v1/positions');
}
