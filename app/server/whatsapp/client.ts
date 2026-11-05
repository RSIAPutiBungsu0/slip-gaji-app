import { WhatsAppConfig } from '@/app/types/config';
import { logAudit } from '../logger/audit';

export interface SendWhatsAppDocumentParams {
  config: WhatsAppConfig;
  recipientPhone: string; // Format: 628xxxxxxxxxx
  pdfBuffer: Buffer;
  pdfFilename: string;
  employeeNik: string;
  employeeName: string;
  periodLabel: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Sends a PDF document via Meta WhatsApp Cloud API (v20.0) or Simulated Mode.
 */
export async function sendWhatsAppPayslip(params: SendWhatsAppDocumentParams): Promise<SendWhatsAppResult> {
  const {
    config,
    recipientPhone,
    pdfBuffer,
    pdfFilename,
    employeeNik,
    employeeName,
    periodLabel
  } = params;

  // Check if simulation mode is active or credentials are unset
  const isSimulation = config.simulationMode || !config.accessToken || !config.phoneNumberId;

  if (isSimulation) {
    // Simulate network delay 500ms - 1000ms
    const delay = Math.floor(Math.random() * 500) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Check valid phone
    if (!recipientPhone.startsWith('628') || recipientPhone.length < 10) {
      return {
        success: false,
        error: `Nomor telepon ${recipientPhone} tidak valid untuk WhatsApp`,
        isSimulated: true
      };
    }

    // Generate simulated Meta message ID
    const randomHex = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const simulatedMsgId = `wamid.HBgM${recipientPhone.slice(-4)}${randomHex}`;

    await logAudit(
      'WA_SEND_SIMULATED',
      `[SIMULASI] Slip ${employeeNik} (${employeeName}) terkirim ke ${recipientPhone}`,
      'SUCCESS'
    );

    return {
      success: true,
      messageId: simulatedMsgId,
      isSimulated: true
    };
  }

  // Real Meta WhatsApp Cloud API call
  try {
    const phoneNumberId = config.phoneNumberId.trim();
    const token = config.accessToken.trim();

    // 1. Upload Media
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
    formData.append('file', blob, pdfFilename);
    formData.append('type', 'application/pdf');
    formData.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `Gagal upload media ke Meta (HTTP ${uploadRes.status})`;
      return { success: false, error: errMsg };
    }

    const uploadData = await uploadRes.json();
    const mediaId = uploadData.id;

    // 2. Send Document Message
    const caption = `Halo Bapak/Ibu ${employeeName}, terlampir slip gaji resmi periode ${periodLabel}. Dokumen ini bersifat rahasia.`;

    const messagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'document',
      document: {
        id: mediaId,
        caption,
        filename: pdfFilename
      }
    };

    const sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!sendRes.ok) {
      const sendErr = await sendRes.json().catch(() => ({}));
      const errMsg = sendErr?.error?.message || `Gagal mengirim pesan WhatsApp (HTTP ${sendRes.status})`;
      return { success: false, error: errMsg };
    }

    const sendData = await sendRes.json();
    const messageId = sendData?.messages?.[0]?.id || `wamid.${Date.now()}`;

    await logAudit(
      'WA_SEND_OFFICIAL',
      `Slip ${employeeNik} (${employeeName}) berhasil dikirim via Meta API ke ${recipientPhone} (ID: ${messageId})`,
      'SUCCESS'
    );

    return {
      success: true,
      messageId,
      isSimulated: false
    };
  } catch (err) {
    const errMsg = (err as Error).message || 'Terjadi kesalahan jaringan saat menghubungi Meta WhatsApp API';
    await logAudit('WA_SEND_ERROR', `Error pengiriman ${employeeNik}: ${errMsg}`, 'ERROR');
    return {
      success: false,
      error: errMsg
    };
  }
}
