import ActivityLog from '../database/model/RecentActiviity.Model';
import asyncHandler from '../utils/AsyncHandler';
import { Request, Response, NextFunction } from 'express';

class RecentActivityController {
  public RetriveRecentAvtivity = asyncHandler(
    async (req: Request, res: Response) => {
      const recentActivity = await ActivityLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
      });
      res.status(200).json({ status: 'true', data: recentActivity });
    }
  );
}

export default new RecentActivityController();
