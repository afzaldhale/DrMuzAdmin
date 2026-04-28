export function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function whatsappLink(phone: string, message: string) {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}

export function confirmationMessage(
  doctor = "Dr. Muzammil Ambekar",
  date = "",
  time = "",
  location = ""
) {
  return `Hello,

Your appointment with ${doctor} has been confirmed.

📅 Date: ${date}
⏰ Time: ${time}
📍 Location: ${location}

Kindly arrive 10-15 minutes early.

Thank you.`;
}

export function rescheduleMessage(
  date: string,
  time: string,
  doctor = "Dr. Muzammil Ambekar",
  location = ""
) {
  return `Hello,

Your appointment with ${doctor} has been rescheduled.

📅 New Date: ${date}
⏰ New Time: ${time}
📍 Location: ${location}

Please be available on time.

Thank you.`;
}

export function cancelMessage(
  doctor = "Dr. Muzammil Ambekar"
) {
  return `Hello,

Your appointment with ${doctor} has been cancelled.

Please contact us to reschedule your appointment.

Thank you.`;
}