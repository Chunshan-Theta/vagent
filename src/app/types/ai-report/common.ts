import type { ReactNode } from 'react';

export interface Score {
  criterion: string;
  score: number;
  explanation: string;
  examples: string[];
  improvementTips: string[];
}

export interface AnalysisResponse {
  overallScore: number;
  feedback: string;
  summary: string;
  overallImprovementTips: string[];
  scores: Score[];
  language: string;
}

export interface TimelineData {
  role: string;
  content: string;
}

export interface ReportDatas {
  timeline: TimelineData[];
}

export interface TimelineItem {
  node: React.ReactNode;
  meta?: {
    title?: string;
    subtitle?: string;
    timelineColor?: string;
    subtitleColor?: string;
    aiAudio?: { url: string; startTime?: number };
    userAudio?: { url: string; startTime?: number };
  };
}

export interface TimelineContainerProps {
  items: TimelineItem[];
  className?: string;
} 