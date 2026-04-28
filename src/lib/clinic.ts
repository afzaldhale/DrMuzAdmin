// src/lib/clinic.ts

export interface ClinicDetails {
  doctor_name: string;
  clinic_name: string;
  clinic_phone: string;
  clinic_whatsapp: string;
  clinic_email: string;
  clinic_website: string;
  clinic_address: string;
}

export const clinicDetails: ClinicDetails = {
  doctor_name: "Dr Muzammil Ambekar",

  clinic_name: "Dr. Ambekar's Brain & Spine Surgery Clinic",

  clinic_phone: "919122229096",
  clinic_whatsapp: "919122229096",

  clinic_email: "dr.ambekarneuro@gmail.com",

  clinic_website: "www.dr-ambekarneuro.com",

  clinic_address:
    "Office No. 06, Ground Floor, Bramha Estate Commercial Premises, Near Jyoti Hotel, Kondhwa, Pune – 411048",
};

export function getClinicDetails(): ClinicDetails {
  return clinicDetails;
} 

 