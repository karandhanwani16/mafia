import { body, param, validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

export const roomValidation = {
  create: [
    body('hostName')
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Host name must be between 1 and 20 characters'),
    body('maxPlayers')
      .optional()
      .isInt({ min: 5, max: 12 })
      .withMessage('Max players must be between 5 and 12')
  ],
  join: [
    param('roomId').notEmpty().withMessage('Room ID is required'),
    body('playerName')
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Player name must be between 1 and 20 characters')
  ],
  joinByCode: [
    body('roomCode')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Room code is required'),
    body('playerName')
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Player name must be between 1 and 20 characters')
  ],
  start: [
    param('roomId').notEmpty().withMessage('Room ID is required'),
    body('playerId').notEmpty().withMessage('Player ID is required')
  ],
  leave: [
    param('roomId').notEmpty().withMessage('Room ID is required'),
    body('playerId').notEmpty().withMessage('Player ID is required')
  ]
};

export const gameValidation = {
  action: [
    param('gameId').notEmpty().withMessage('Game ID is required'),
    body('playerId').notEmpty().withMessage('Player ID is required'),
    body('actionType').isIn(['kill', 'save', 'investigate']).withMessage('Invalid action type'),
    body('targetId').notEmpty().withMessage('Target ID is required')
  ],
  vote: [
    param('gameId').notEmpty().withMessage('Game ID is required'),
    body('playerId').notEmpty().withMessage('Player ID is required'),
    body('targetId').notEmpty().withMessage('Target ID is required')
  ]
};
