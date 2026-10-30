import { Router, type Request, type Response, type NextFunction } from 'express';
import { ObjectId, type Db } from 'mongodb';
import type { Analysis, DashboardSummary, SavedScan } from '../../shared/types.js';

export const RETENTION_DAYS = 30;
type ScanRecord = { _id?: ObjectId; ownerId: string; createdAt: Date; expiresAt: Date; analysis: Analysis };
const reject = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });
const authenticated = (req: Request, res: Response, next: NextFunction) => req.session.userId
  ? next() : reject(res, 401, 'AUTH_REQUIRED', 'Sign in to view your scans.');
const toSavedScan = (record: ScanRecord): SavedScan => ({ ...record.analysis, scanId: record._id!.toHexString(),
  analyzedAt: record.createdAt.toISOString(), expiresAt: record.expiresAt.toISOString() });

export async function createHistory(db: Db) {
  const scans = db.collection<ScanRecord>('scans');
  await scans.createIndex({ ownerId: 1, createdAt: -1, _id: -1 });
  await scans.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const router = Router();
  router.use('/scans', authenticated);
  router.use('/dashboard', authenticated);

  async function save(ownerId: string, analysis: Analysis): Promise<SavedScan> {
    // Persist numeric evidence and fixed explanations, never the submitted URL or hostname.
    const minimized: Analysis = {
      schemaVersion: analysis.schemaVersion, requestId: analysis.requestId, status: analysis.status,
      mode: analysis.mode, verdict: analysis.verdict, score: analysis.score, scoreType: analysis.scoreType,
      threshold: analysis.threshold, featureVersion: analysis.featureVersion,
      rules: structuredClone(analysis.rules), model: structuredClone(analysis.model),
      evidence: structuredClone(analysis.evidence), limitations: [...analysis.limitations],
      report: analysis.report ? { version: analysis.report.version,
        input: { scheme: analysis.report.input.scheme, hostname: null, hostType: analysis.report.input.hostType,
          urlLength: analysis.report.input.urlLength, pathLength: analysis.report.input.pathLength,
          queryLength: analysis.report.input.queryLength, hasUserinfo: analysis.report.input.hasUserinfo },
        indicators: structuredClone(analysis.report.indicators),
        modelExplanation: structuredClone(analysis.report.modelExplanation),
        recommendations: [...analysis.report.recommendations] } : null,
    };
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + RETENTION_DAYS * 86400000);
    const record: ScanRecord = { ownerId, createdAt, expiresAt, analysis: minimized };
    const result = await scans.insertOne(record);
    return { ...analysis, scanId: result.insertedId.toHexString(), analyzedAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() };
  }

  router.get('/scans', async (req, res) => {
    if (Object.keys(req.query).some(key => key !== 'page' && key !== 'limit')) {
      return reject(res, 400, 'INVALID_PAGINATION', 'Only page and limit are supported.');
    }
    const pageText = req.query.page ?? '1', limitText = req.query.limit ?? '10';
    if (typeof pageText !== 'string' || typeof limitText !== 'string' || !/^\d+$/.test(pageText) || !/^\d+$/.test(limitText)) {
      return reject(res, 400, 'INVALID_PAGINATION', 'Use a page number and a limit of 1–50.');
    }
    const page = Number(pageText), limit = Number(limitText);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return reject(res, 400, 'INVALID_PAGINATION', 'Use page 1–10000 and limit 1–50.');
    }
    // TTL cleanup is asynchronous. Every read also excludes logically expired records.
    const filter = { ownerId: req.session.userId!, expiresAt: { $gt: new Date() } };
    const [records, total] = await Promise.all([
      scans.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      scans.countDocuments(filter),
    ]);
    res.json({ items: records.map(record => ({ id: record._id.toHexString(), createdAt: record.createdAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(), verdict: record.analysis.verdict, score: record.analysis.score,
      scoreType: record.analysis.scoreType, mode: record.analysis.mode, ruleCount: record.analysis.rules.reasons.length,
      modelVersion: record.analysis.model.version })), page, limit, total, pages: Math.ceil(total / limit), retentionDays: RETENTION_DAYS });
  });

  router.get('/dashboard/summary', async (req, res) => {
    const [summary] = await scans.aggregate<DashboardSummary>([
      { $match: { ownerId: req.session.userId!, expiresAt: { $gt: new Date() } } },
      { $group: { _id: null, total: { $sum: 1 },
        high: { $sum: { $cond: [{ $eq: ['$analysis.verdict', 'high'] }, 1, 0] } },
        review: { $sum: { $cond: [{ $eq: ['$analysis.verdict', 'review'] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ['$analysis.verdict', 'low'] }, 1, 0] } },
        partial: { $sum: { $cond: [{ $eq: ['$analysis.status', 'partial'] }, 1, 0] } },
        latestScanAt: { $max: '$createdAt' } } },
      { $project: { _id: 0 } },
    ]).toArray();
    res.json({ ...(summary ?? { total: 0, high: 0, review: 0, low: 0, partial: 0, latestScanAt: null }), retentionDays: RETENTION_DAYS });
  });

  router.delete('/scans', async (req, res) => {
    await scans.deleteMany({ ownerId: req.session.userId! });
    res.status(204).end();
  });

  for (const method of ['get', 'delete'] as const) {
    router[method]('/scans/:id', async (req, res) => {
      if (typeof req.params.id !== 'string' || !/^[0-9a-f]{24}$/i.test(req.params.id)) {
        return reject(res, 404, 'SCAN_NOT_FOUND', 'Scan not found.');
      }
      const filter = { _id: new ObjectId(req.params.id), ownerId: req.session.userId!, expiresAt: { $gt: new Date() } };
      if (method === 'delete') {
        const result = await scans.deleteOne(filter);
        if (!result.deletedCount) return reject(res, 404, 'SCAN_NOT_FOUND', 'Scan not found.');
        return res.status(204).end();
      }
      const record = await scans.findOne(filter);
      if (!record) return reject(res, 404, 'SCAN_NOT_FOUND', 'Scan not found.');
      res.json(toSavedScan(record));
    });
  }
  return { router, save };
}
