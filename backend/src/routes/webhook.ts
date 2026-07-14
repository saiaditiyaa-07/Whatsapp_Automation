import { Router, Request, Response, NextFunction } from 'express';
import { RuleEngineService } from '../services/ruleEngine';
import { verifyWhatsAppSignature } from '../middleware/signature';

const router = Router();

/**
 * GET /api/webhook/whatsapp
 * Meta WhatsApp Cloud API Webhook Verification handshake.
 */
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedVerifyToken) {
    console.log('[Webhook Get]: Webhook handshake verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook Get Warning]: Handshake failed. Token mismatch.');
    res.sendStatus(403);
  }
});

/**
 * POST /api/webhook/whatsapp
 * Meta WhatsApp Webhook Payload Listener (processes messages & status logs).
 */
router.post('/', verifyWhatsAppSignature, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      res.status(200).json({ success: true, message: 'Ignored non-whatsapp object type' });
      return;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        const phone_number_id = value.metadata?.phone_number_id;
        if (!phone_number_id) {
          console.warn('[Webhook Post Warning]: Missing phone_number_id in metadata');
          continue;
        }

        // 1. Process Status Updates (delivery receipts)
        if (value.statuses && value.statuses.length > 0) {
          for (const statusObj of value.statuses) {
            await RuleEngineService.handleStatusUpdate(phone_number_id, statusObj);
          }
        }

        // 2. Process Messages (incoming communications)
        if (value.messages && value.messages.length > 0) {
          for (const messageObj of value.messages) {
            const senderPhone = messageObj.from;
            const messageId = messageObj.id;
            const timestamp = messageObj.timestamp;
            const textBody = messageObj.text?.body;

            // Resolve contact name from profile if available
            const contactObj = value.contacts?.find((c: any) => c.wa_id === senderPhone);
            const senderName = contactObj?.profile?.name;

            await RuleEngineService.handleIncomingMessage({
              phone_number_id,
              senderPhone,
              senderName,
              messageId,
              textBody,
              timestamp,
            });
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
