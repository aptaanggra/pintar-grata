export interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
  timestamp: string;
}

export interface ExploreReport {
  id: string;
  photoData: string; // Base64 image
  description: string;
  createdAt: string;
  chatHistory: ChatMessage[];
}

export interface Assignment {
  id: string;
  filename: string;
  fileType: string; // 'png' | 'pdf' | 'jpg' | 'jpeg' | etc.
  fileData: string; // Base64 data representation
  score: number | null;
  review: string | null; // AI feedback review
  uploadedAt: string;
}

export interface DailyQuestion {
  id: string; // Date string: YYYY-MM-DD
  date: string; // YYYY-MM-DD
  subject: string;
  question: string;
  userAnswer: string | null;
  aiFeedback: string | null;
  score: number | null;
  answeredAt: string | null;
}

export interface WeeklyReview {
  id: string; // YYYY-[week number]
  weekRange: string;
  releasedAt: string;
  summary: string;
  achievements: string[];
  statistics: {
    essaysCount: number;
    explorationsCount: number;
    assignmentsCount: number;
    averageScore: number;
  };
}
