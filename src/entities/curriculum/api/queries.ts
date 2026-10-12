import { queryOptions, skipToken } from '@tanstack/react-query';

import { getCurriculumTree, listCurriculums } from './api';

export const curriculumKeys = {
  list: (trackPageId: number | '') => ['curriculums', trackPageId] as const,
  tree: (curriculumId: number | '') => ['curriculum-tree', curriculumId] as const,
};

export const curriculumQueries = {
  list: (trackPageId: number | '') =>
    queryOptions({
      queryKey: curriculumKeys.list(trackPageId),
      queryFn: trackPageId === '' ? skipToken : () => listCurriculums(trackPageId),
    }),
  tree: (curriculumId: number | '') =>
    queryOptions({
      queryKey: curriculumKeys.tree(curriculumId),
      queryFn: curriculumId === '' ? skipToken : () => getCurriculumTree(curriculumId),
    }),
};
