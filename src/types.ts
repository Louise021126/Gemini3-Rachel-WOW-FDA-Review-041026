export type Language = 'en' | 'zh';

export interface SubmissionData {
  summary: string;
  reviewNotes: string;
  guidance: string;
  template: string;
}

export interface AgentResult {
  webSearchSummary?: string;
  comprehensiveSummary?: string;
  dataset?: any;
  reviewReport?: string;
  skillMd?: string;
  followUpQuestions?: string[];
}

export interface Entity {
  id: string;
  key: string;
  value: string;
  description: string;
}
