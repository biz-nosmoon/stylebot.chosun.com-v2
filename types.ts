
export interface StyleRule {
  id: string;
  category: 'vocabulary' | 'grammar' | 'loanword' | 'style';
  wrong: string;
  correct: string;
  description?: string;
  example?: string;
}

export interface LoanwordTable {
  language: string;
  rules: {
    symbol: string;
    condition: string;
    korean: string;
    examples: { original: string; korean: string }[];
  }[];
}

export interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  details?: string;
}
