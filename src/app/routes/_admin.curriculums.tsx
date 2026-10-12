import { createFileRoute } from '@tanstack/react-router';

import { CurriculumsPage as Screen } from '@/pages/curriculums';
export const Route = createFileRoute('/_admin/curriculums')({ component: Screen });
