import { queryOptions } from '@tanstack/react-query';
import { getRecruitLink, getRecruitLinkHistory, listMentorSlots, listQnaItems } from './api';

export const homeKeys = {
  mentorSlots: () => ['mentor-slots'] as const,
  qnaItems: () => ['qna-items'] as const,
  recruitLink: () => ['recruit-link'] as const,
  recruitLinkHistory: () => ['recruit-link-history'] as const,
};

export const homeQueries = {
  mentorSlots: () => queryOptions({ queryKey: homeKeys.mentorSlots(), queryFn: listMentorSlots }),
  qnaItems: () => queryOptions({ queryKey: homeKeys.qnaItems(), queryFn: listQnaItems }),
  recruitLink: () => queryOptions({ queryKey: homeKeys.recruitLink(), queryFn: getRecruitLink }),
  recruitLinkHistory: () => queryOptions({ queryKey: homeKeys.recruitLinkHistory(), queryFn: getRecruitLinkHistory }),
};
