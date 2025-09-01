import express from 'express';
import RecentActivityController from '../controller/RecentActivity.controller';
const router = express.Router();
router.get('/', RecentActivityController.RetriveRecentAvtivity);

export default router;
