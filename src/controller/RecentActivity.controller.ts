import ActivityLog from '../database/model/RecentActiviity.Model';
import asyncHandler from '../utils/AsyncHandler';
import { Request, Response, NextFunction } from 'express';

class RecentActivityController {
  public RetriveRecentAvtivity = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const limit = parseInt(req.query.limit as string) || 5;
      const recentActivity = await ActivityLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit,
      });

      if (!recentActivity || recentActivity.length === 0) {
        return res.status(404).json({ status: 'false', message: 'No activity found' });
      }

      res.status(200).json({
        status: 'true',
        count: recentActivity.length,
        data: recentActivity,
        fetchedAt: new Date(),
      });
    }
  );
}

export default new RecentActivityController();
