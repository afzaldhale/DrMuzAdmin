import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export const isEmailConfigured = Boolean(
  SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY
);

export interface AppointmentEmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;

  appointment_date?: string;
  appointment_time?: string;
  location?: string;

  doctor_name?: string;

  clinic_name?: string;
  clinic_phone?: string;
  clinic_whatsapp?: string;
  clinic_email?: string;
  clinic_website?: string;
  clinic_address?: string;

  status?: string;
}

export async function sendAppointmentEmail(
  params: AppointmentEmailParams
) {
  try {
    if (!isEmailConfigured) {
      console.warn("[EmailJS] Not configured. Payload:", params);
      return { ok: false, stub: true };
    }

    const payload = {
      to_email: params.to_email || "",
      to_name: params.to_name || "",
      subject: params.subject || "",
      message: params.message || "",

      appointment_date: params.appointment_date || "",
      appointment_time: params.appointment_time || "",
      location: params.location || "",

      doctor_name: params.doctor_name || "",

      clinic_name: params.clinic_name || "",
      clinic_phone: params.clinic_phone || "",
      clinic_whatsapp: params.clinic_whatsapp || "",
      clinic_email: params.clinic_email || "",
      clinic_website: params.clinic_website || "",
      clinic_address: params.clinic_address || "",

      status: params.status || "",
    };

    console.log("[EmailJS] Sending payload:", payload);

    const response = await emailjs.send(
      SERVICE_ID!,
      TEMPLATE_ID!,
      payload,
      {
        publicKey: PUBLIC_KEY!,
      }
    );

    console.log("[EmailJS] Success:", response);

    return {
      ok: true,
      response,
    };
  } catch (error: any) {
    console.error("[EmailJS] Failed:", error);

    return {
      ok: false,
      error: error?.text || error?.message || "Failed to send email",
    };
  }
}

export function buildConfirmationBody(o: {
  patientName: string;
  date: string;
  time: string;
  location: string;
  doctor: string;
  clinic: string;
}) {
  return `Hello ${o.patientName},

Your appointment has been successfully confirmed.

Date: ${o.date}
Time: ${o.time}
Location: ${o.location}
Doctor: ${o.doctor}

Thank you.

Regards,
${o.clinic}`;
}

export function buildRescheduleBody(o: {
  patientName: string;
  date: string;
  time: string;
  location: string;
  clinic: string;
}) {
  return `Hello ${o.patientName},

Your appointment has been rescheduled.

New Date: ${o.date}
New Time: ${o.time}
Location: ${o.location}

Regards,
${o.clinic}`;
}

export function buildCancelBody(o: {
  patientName: string;
  clinic: string;
}) {
  return `Hello ${o.patientName},

Your appointment has been cancelled.

Please contact us to reschedule.

Regards,
${o.clinic}`;
}