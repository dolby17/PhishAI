export type Reason = { code: string; feature: string; observed: number; weight: number; message: string };
export type ModelExplanation = {
  status: 'available' | 'unavailable' | 'unsupported'; method: 'tree_path_score_change'; baseline: number | null;
  contributions: { feature: string; label: string; observed: number; contribution: number }[]; note: string;
};
export type AnalysisReport = {
  version: 'report-1.0.0';
  input: { scheme: string; hostname: string | null; hostType: 'domain' | 'ip'; urlLength: number; pathLength: number; queryLength: number; hasUserinfo: boolean };
  indicators: { code: string; explanation: string; recommendation: string }[];
  modelExplanation: ModelExplanation; recommendations: string[];
};
export type Analysis = {
  schemaVersion: '1.0'; requestId: string; status: 'complete' | 'partial';
  mode: 'rules_only' | 'ml' | 'hybrid'; verdict: 'low' | 'review' | 'high';
  score: number; scoreType: 'heuristic' | 'uncalibrated_model_score' | 'decision_score';
  threshold: number; featureVersion: string;
  rules: { version: string; score: number; scoreType: 'heuristic'; reasons: Reason[] };
  model: { status: 'available' | 'unavailable'; version: string | null; score: number | null; scoreType: string };
  evidence: { external: 'disabled'; destinationContacted: false }; limitations: string[];
  report?: AnalysisReport | null;
};
export type SavedScan = Analysis & { scanId: string; analyzedAt: string; expiresAt: string };
export type HistoryItem = {
  id: string; createdAt: string; expiresAt: string; verdict: Analysis['verdict']; score: number;
  scoreType: Analysis['scoreType']; mode: Analysis['mode']; ruleCount: number; modelVersion: string | null;
};
export type HistoryPage = { items: HistoryItem[]; page: number; limit: number; total: number; pages: number; retentionDays: number };
export type DashboardSummary = { total: number; high: number; review: number; low: number; partial: number; latestScanAt: string | null; retentionDays: number };
