import { prisma } from '../config/database';
import { WhatsAppService } from './whatsapp';

export interface InboundMessagePayload {
  phone_number_id: string;
  senderPhone: string;
  senderName?: string;
  messageId: string;
  textBody?: string;
  timestamp: string;
}

export class RuleEngineService {
  /**
   * Processes an incoming WhatsApp message, matches rules, sends reply, and records logs
   */
  static async handleIncomingMessage(payload: InboundMessagePayload) {
    const { phone_number_id, senderPhone, senderName, messageId, textBody, timestamp } = payload;
    const bodyText = textBody?.trim() || '';

    console.log(`[RuleEngine]: Incoming message from ${senderPhone} to phone ID ${phone_number_id}: "${bodyText}"`);

    // 1. Resolve workspace from phone number ID
    const account = await prisma.whatsAppAccount.findUnique({
      where: { phone_number_id },
      include: { workspace: true },
    });

    if (!account) {
      console.warn(`[RuleEngine Warning]: WhatsAppAccount with ID ${phone_number_id} not registered.`);
      return;
    }

    const workspaceId = account.workspaceId;

    // 2. Sync Contact directory (Upsert)
    const contactName = senderName || null;
    await prisma.contact.upsert({
      where: {
        workspaceId_phone: {
          workspaceId,
          phone: senderPhone,
        },
      },
      update: contactName ? { name: contactName } : {},
      create: {
        workspaceId,
        phone: senderPhone,
        name: contactName,
      },
    });

    // 3. Log Inbound Message
    await prisma.messageLog.create({
      data: {
        workspaceId,
        phone_number_id,
        direction: 'INBOUND',
        senderPhone,
        recipientPhone: phone_number_id,
        messageText: bodyText,
        status: 'READ',
        metadata: { messageId, timestamp },
      },
    });

    if (!bodyText) {
      console.log('[RuleEngine]: Empty message text body. Skipping rules matching.');
      return;
    }

    // 4. Match Automation Rule
    // Case-insensitive contains match
    const rules = await prisma.automationRule.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
    });

    const matchedRule = rules.find((rule) =>
      bodyText.toLowerCase().includes(rule.triggerKeyword.toLowerCase())
    );

    if (!matchedRule) {
      console.log(`[RuleEngine]: No active automation rules matched for "${bodyText}".`);
      return;
    }

    console.log(`[RuleEngine]: Match found! Keyword "${matchedRule.triggerKeyword}" -> Reply text: "${matchedRule.replyText || 'N/A'}" / Template: "${matchedRule.templateId || 'N/A'}"`);

    // 5. Send Outbound message & Log response
    let outboundStatus = 'SENT';
    const outboundMetadata: any = { matchedRuleId: matchedRule.id };

    try {
      const response = await WhatsAppService.sendMessage({
        phone_number_id,
        access_token: account.access_token,
        to: senderPhone,
        text: matchedRule.replyText || undefined,
        templateId: matchedRule.templateId || undefined,
      });

      if (response.success && response.messageId) {
        outboundMetadata.metaMessageId = response.messageId;
      }
      outboundMetadata.metaResponse = response.data;
    } catch (error: any) {
      console.error('[RuleEngine Outbound Send Error]:', error);
      outboundStatus = 'FAILED';
      outboundMetadata.error = error.message || 'Failed outbound send';
      outboundMetadata.errorDetails = error.details || null;
    }

    // 6. Record Outbound Message Log
    await prisma.messageLog.create({
      data: {
        workspaceId,
        phone_number_id,
        direction: 'OUTBOUND',
        senderPhone: phone_number_id,
        recipientPhone: senderPhone,
        messageText: matchedRule.replyText || `[Template: ${matchedRule.templateId}]`,
        status: outboundStatus,
        metadata: outboundMetadata,
      },
    });
  }

  /**
   * Updates an existing outbound message log with new status updates from webhook (e.g. delivered, read)
   */
  static async handleStatusUpdate(phone_number_id: string, statusPayload: any) {
    const metaMessageId = statusPayload.id;
    const status = statusPayload.status?.toUpperCase(); // DELIVERED, READ, SENT, FAILED
    const timestamp = statusPayload.timestamp;
    const recipientPhone = statusPayload.recipient_id;

    console.log(`[RuleEngine]: Status update for message ${metaMessageId} -> ${status}`);

    // Look for log using Prisma and scan matching records.
    // Query logs in the workspace with OUTBOUND and matching recipientPhone, then filter for metaMessageId.
    const logs = await prisma.messageLog.findMany({
      where: {
        phone_number_id,
        direction: 'OUTBOUND',
        recipientPhone,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Scan recent messages
    });

    const matchingLog = logs.find((l) => {
      const meta = l.metadata as any;
      return meta && meta.metaMessageId === metaMessageId;
    });

    if (matchingLog) {
      const currentMetadata = matchingLog.metadata as any;
      await prisma.messageLog.update({
        where: { id: matchingLog.id },
        data: {
          status,
          metadata: {
            ...currentMetadata,
            [`status_${status.toLowerCase()}_at`]: timestamp,
          },
        },
      });
      console.log(`[RuleEngine]: Updated message log ID ${matchingLog.id} status to ${status}`);
    } else {
      console.log(`[RuleEngine Warning]: Message log not found for Meta ID ${metaMessageId}`);
    }
  }
}
