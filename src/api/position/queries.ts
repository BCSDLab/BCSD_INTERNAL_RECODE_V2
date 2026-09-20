import { queryOptions } from '@tanstack/react-query';
import { listPositions } from './api';

export const positionKeys = {
  list: () => ['positions'] as const,
};

export const positionQueries = {
  list: () => queryOptions({ queryKey: positionKeys.list(), queryFn: listPositions }),
};
