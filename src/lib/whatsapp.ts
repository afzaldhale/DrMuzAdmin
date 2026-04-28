export function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function whatsappLink(phone: string, message: string) {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}

export function confirmationMessage(doctor = "Dr. Muzammil Ambekar") {
  return `Hello, your appointment with ${doctor} has been confirmed.`;
}
export function rescheduleMessage(date: string, time: string, doctor = "Dr. Muzammil Ambekar") {
  return `Hello, your appointment with ${doctor} has been rescheduled to ${date} at ${time}.`;
}
export function cancelMessage(doctor = "Dr. Muzammil Ambekar") {
  return `Hello, your appointment with ${doctor} has been cancelled. Please contact us to reschedule.`;
}
