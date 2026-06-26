export interface DeadlineAction {
  title: string;
  date: string;
  actionRequired: string;
  isHighPriority: boolean;
}

export interface PaymentDetails {
  amountDue?: string;
  dueDate?: string;
  payee?: string;
  penaltyDetails?: string;
}

export interface AnalysisResult {
  documentType: string;
  documentPurpose: string;
  simplifiedSummary: string;
  deadlinesAndActions: DeadlineAction[];
  paymentDetails?: PaymentDetails;
  requiredDocuments: string[];
  recommendations: string[];
  extractedText: string;
  isOfflineMode?: boolean;
  warningMessage?: string;
}

export interface DocumentPreset {
  id: string;
  title: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface Reminder {
  id: string;
  docTitle: string;
  title: string;
  date: string;
  action: string;
  completed: boolean;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  type: string;
  language: string;
  result: AnalysisResult;
}
