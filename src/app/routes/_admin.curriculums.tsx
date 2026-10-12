import { createFileRoute } from '@tanstack/react-router';

import { CurriculumsPage as Screen, validateCurriculumSearch } from '@/pages/curriculums';
export const Route = createFileRoute('/_admin/curriculums')({
  validateSearch: validateCurriculumSearch,
  component: Screen,
});
