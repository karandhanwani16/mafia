import express from 'express';
import {
  createRoom,
  joinRoom,
  joinRoomByCode,
  getRoom,
  startGame,
  leaveRoom,
  deleteRoom
} from '../controllers/roomController.js';
import { validate, roomValidation } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/auth.js';

const router = express.Router();

router.post('/', apiLimiter, validate(roomValidation.create), createRoom);
// Join by room code (must be before /:roomId/join so "join-by-code" isn't parsed as roomId)
router.post('/join-by-code', apiLimiter, validate(roomValidation.joinByCode), joinRoomByCode);
router.post('/:roomId/join', apiLimiter, validate(roomValidation.join), joinRoom);
router.get('/:roomId', apiLimiter, getRoom);
router.post('/:roomId/start', apiLimiter, validate(roomValidation.start), startGame);
router.post('/:roomId/leave', apiLimiter, validate(roomValidation.leave), leaveRoom);
router.delete('/:roomId', apiLimiter, deleteRoom);

export default router;
