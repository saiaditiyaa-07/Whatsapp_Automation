import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface ExtendedRequest extends Request {
  rawBody?: Buffer;
}

export function verifyWhatsAppSignature(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  
  if (!appSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Signature Verify Error]: WHATSAPP_APP_SECRET is not configured in production.');
      res.status(500).json({ success: false, error: 'App configuration error.' });
      return;
    }
    console.warn('[Signature Verify]: WHATSAPP_APP_SECRET not configured. Skipping validation.');
    next();
    return;
  }

  const signatureHeader = req.headers['x-hub-signature-256'] as string;
  if (!signatureHeader) {
    res.status(401).json({ success: false, error: 'Missing X-Hub-Signature-256 header' });
    return;
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    res.status(400).json({ success: false, error: 'Invalid signature header format' });
    return;
  }

  const signature = parts[1];
  if (!req.rawBody) {
    res.status(500).json({ success: false, error: 'Raw request body not captured' });
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(req.rawBody)
    .digest('hex');

  try {
    const checksum = Buffer.from(signature, 'hex');
    const expectedChecksum = Buffer.from(expectedSignature, 'hex');

    if (checksum.length !== expectedChecksum.length || !crypto.timingSafeEqual(checksum, expectedChecksum)) {
      res.status(401).json({ success: false, error: 'Signature mismatch' });
      return;
    }
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid hex values in signature' });
    return;
  }

  next();
}
