import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getTimeline, TimelineTypeFilter } from '../services/timeline.service';

/**
 * GET /api/timeline — the requesting patient's own activity feed.
 * Scope is ALWAYS req.user._id (never a client-supplied id), so cross-patient
 * access is impossible by construction.
 */
export const getMyTimeline = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 20, 1), 50);
  const { events, nextCursor, hasMore } = await getTimeline(req.user!._id, {
    limit,
    cursor: req.query.cursor ? String(req.query.cursor) : undefined,
    type: req.query.type ? (String(req.query.type) as TimelineTypeFilter) : undefined,
  });
  res.json({ success: true, data: { events, nextCursor, hasMore } });
});
