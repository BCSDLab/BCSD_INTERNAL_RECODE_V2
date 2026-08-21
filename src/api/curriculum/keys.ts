export const curriculumKeys = {
  list: (trackPageId: number | '') => ['curriculums', trackPageId] as const,
  tree: (curriculumId: number | '') => ['curriculum-tree', curriculumId] as const,
};
