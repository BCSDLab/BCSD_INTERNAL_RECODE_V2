export interface CurriculumSummaryResponse {
  id: number;
  name: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface CurriculumTopicNode {
  id: number;
  title: string;
  displayOrder: number;
  details: string[];
}

export interface CurriculumWeekNode {
  id: number;
  weekFrom: number;
  weekTo: number | null;
  displayOrder: number;
  topics: CurriculumTopicNode[];
}

export interface CurriculumTreeResponse {
  id: number;
  name: string;
  isPublished: boolean;
  weeks: CurriculumWeekNode[];
}
