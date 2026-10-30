export type Reason = { code: string; feature: string; observed: number; weight: number; message: string };
export type Analysis = {
  schemaVersion: '1.0'; requestId: string; status: 'complete' | 'partial';
  mode: 'rules_only' | 'ml' | 'hybrid'; verdict: 'low' | 'review' | 'high';
  score: number; scoreType: 'heuristic' | 'uncalibrated_model_score' | 'decision_score';
  threshold: number; featureVersion: string;
  rules: { version: string; score: number; scoreType: 'heuristic'; reasons: Reason[] };
  model: { status: 'available' | 'unavailable'; version: string | null; score: number | null; scoreType: string };
  evidence: { external: 'disabled'; destinationContacted: false }; limitations: string[];
};
