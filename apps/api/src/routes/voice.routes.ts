import { Router } from 'express';

export const voiceRouter = Router();

// TODO: Implement voice/mediasoup routes
// POST /voice/transport - Create transport
// POST /voice/connect - Connect transport
// POST /voice/produce - Start producing
// POST /voice/consume - Consume producer

voiceRouter.post('/transport', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});
