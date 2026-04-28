import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const TEMPLATE_RESCHEDULE_ID = import.meta.env
  .VITE_EMAILJS_TEMPLATE_RESCHEDULE as string | undefined;
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

/* DATE FORMAT DD/MM/YY */
function formatIndianDate(date?: string) {
  if (!date) return "";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  const [year, month, day] = parts;
  return `${day}/${month}/${year.slice(2)}`;
}

export async function sendAppointmentEmail(
  params: AppointmentEmailParams
) {
  try {
    if (!isEmailConfigured) {
      console.warn("[EmailJS] Not configured. Payload:", params);
      return { ok: false, stub: true };
    }

    const formattedDate = formatIndianDate(params.appointment_date);

    const payload = {
      to_email: params.to_email || "",
      to_name: params.to_name || "",
      subject: params.subject || "",
      message: params.message || "",

      appointment_date: formattedDate,
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

    let selectedTemplate = TEMPLATE_ID!;

    if (
      params.status === "rescheduled" &&
      TEMPLATE_RESCHEDULE_ID
    ) {
      selectedTemplate = TEMPLATE_RESCHEDULE_ID;
    }

    console.log("[EmailJS] Sending payload:", payload);

    const response = await emailjs.send(
      SERVICE_ID!,
      selectedTemplate,
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

Date: ${formatIndianDate(o.date)}
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

New Date: ${formatIndianDate(o.date)}
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