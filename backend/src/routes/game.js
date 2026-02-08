import express from 'express';
import {
  submitAction,
  submitVote,
  getGameState
} from '../controllers/gameController.js';
import { validate, gameValidation } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/auth.js';

const router = express.Router();

router.post('/:gameId/action', apiLimiter, validate(gameValidation.action), submitAction);
router.post('/:gameId/vote', apiLimiter, validate(gameValidation.vote), submitVote);
router.get('/:gameId/state', apiLimiter, getGameState);

export default router;
