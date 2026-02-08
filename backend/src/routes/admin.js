import express from 'express';
import {
  login,
  logout,
  me,
  needsSetup,
  getSettingsHandler,
  patchSettingsHandler,
  createFirstAdmin,
  listAdmins,
  createAdmin,
  getStats
} from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/needs-setup', needsSetup);
router.post('/login', login);
router.post('/logout', requireAdmin, logout);
router.get('/me', me);
router.post('/setup', createFirstAdmin);

router.get('/settings', requireAdmin, getSettingsHandler);
router.patch('/settings', requireAdmin, patchSettingsHandler);
router.get('/stats', requireAdmin, getStats);
router.get('/admins', requireAdmin, listAdmins);
router.post('/admins', requireAdmin, createAdmin);

export default router;
