import axios from 'axios';

export interface SendMessageOptions {
  phone_number_id: string;
  access_token: string;
  to: string;
  text?: string;
  templateId?: string;
}

export class WhatsAppService {
  private static baseUrl = 'https://graph.facebook.com/v19.0';

  /**
   * Sends a message (text or template) using Meta WhatsApp Cloud API
   */
  static async sendMessage(options: SendMessageOptions) {
    const { phone_number_id, access_token, to, text, templateId } = options;
    const url = `${this.baseUrl}/${phone_number_id}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
    };

    if (templateId) {
      payload.type = 'template';
      payload.template = {
        name: templateId,
        language: {
          code: 'en_US', // Standard fallback, configurable in production
        },
      };
    } else if (text) {
      payload.type = 'text';
      payload.text = {
        preview_url: false,
        body: text,
      };
    } else {
      throw new Error('Either text or templateId must be provided to send a message.');
    }

    try {
      console.log(`[WhatsAppService]: Dispatching message to ${to} via phoneId ${phone_number_id}`);
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id || null,
        data: response.data,
      };
    } catch (error: any) {
      const errorData = error.response?.data?.error || {};
      console.error('[WhatsAppService Send Error]:', errorData);
      throw {
        message: errorData.message || 'Failed to send WhatsApp message via Meta Cloud API',
        code: errorData.code || 'META_API_ERROR',
        details: errorData,
      };
    }
  }
}
