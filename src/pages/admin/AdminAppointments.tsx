import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  CalendarCheck,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Pencil,
  MessageCircle,
  Mail,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "@/lib/firebase";
import { toast } from "sonner";

import {
  whatsappLink,
  confirmationMessage,
  rescheduleMessage,
  cancelMessage,
} from "@/lib/whatsapp";

import {
  sendAppointmentEmail,
  buildConfirmationBody,
  buildRescheduleBody,
  buildCancelBody,
  isEmailConfigured,
} from "@/lib/email";

import { clinicDetails } from "@/lib/clinic";

interface Appt {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  hospitalLocation?: string;
  status: string;
  createdAt?: unknown;
}

const DOCTOR = clinicDetails.doctor_name;
const CLINIC = clinicDetails.clinic_name;

const formatIndianDate = (date: string) => {
  if (!date) return "—";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  const [year, month, day] = parts;
  return `${day}/${month}/${year.slice(2)}`;
};

export default function AdminAppointments() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [editing, setEditing] = useState<Appt | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [deleting, setDeleting] = useState<Appt | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "appointments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Appt[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data();

          return {
            id: docSnap.id,
            patientName: raw.patientName ?? "",
            patientPhone: raw.patientPhone ?? "",
            patientEmail: raw.patientEmail ?? "",
            appointmentDate: raw.appointmentDate ?? "",
            appointmentTime: raw.appointmentTime ?? "",
            hospitalLocation: raw.hospitalLocation ?? "",
            status: raw.status ?? "pending",
            createdAt: raw.createdAt,
          };
        });

        setItems(data);
        setLoading(false);
      },
      () => {
        toast.error("Failed to load appointments");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const locations = Array.from(
    new Set(items.map((i) => i.hospitalLocation).filter(Boolean))
  ) as string[];

  const filtered = items.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (locationFilter !== "all" && a.hospitalLocation !== locationFilter)
      return false;
    if (dateFilter && a.appointmentDate !== dateFilter) return false;

    if (search) {
      const s = search.toLowerCase();

      if (
        !`${a.patientName} ${a.patientEmail} ${a.patientPhone}`
          .toLowerCase()
          .includes(s)
      ) {
        return false;
      }
    }

    return true;
  });

  const updateStatus = async (a: Appt, status: string) => {
    await updateDoc(doc(db, "appointments", a.id), { status });
    toast.success(`Marked as ${status}`);
  };

  const sendEmailFor = async (
    a: Appt,
    kind: "confirmed" | "rescheduled" | "cancelled",
    overrides?: { date?: string; time?: string }
  ) => {
    const rawDate = overrides?.date ?? a.appointmentDate;
    const date = formatIndianDate(rawDate);
    const time = overrides?.time ?? a.appointmentTime;

    const subjects = {
      confirmed: `Appointment Confirmed – ${DOCTOR}`,
      rescheduled: `Appointment Rescheduled – ${DOCTOR}`,
      cancelled: `Appointment Cancelled – ${DOCTOR}`,
    };

    const bodies = {
      confirmed: buildConfirmationBody({
        patientName: a.patientName,
        date,
        time,
        location: a.hospitalLocation ?? "",
        doctor: DOCTOR,
        clinic: CLINIC,
      }),
      rescheduled: buildRescheduleBody({
        patientName: a.patientName,
        date,
        time,
        location: a.hospitalLocation ?? "",
        clinic: CLINIC,
      }),
      cancelled: buildCancelBody({
        patientName: a.patientName,
        clinic: CLINIC,
      }),
    };

    try {
      await sendAppointmentEmail({
        to_email: a.patientEmail,
        to_name: a.patientName,
        subject: subjects[kind],
        message: bodies[kind],
        appointment_date: date,
        appointment_time: time,
        location: a.hospitalLocation ?? "",
        doctor_name: clinicDetails.doctor_name,
        clinic_name: clinicDetails.clinic_name,
        clinic_phone: clinicDetails.clinic_phone,
        clinic_whatsapp: clinicDetails.clinic_whatsapp,
        clinic_email: clinicDetails.clinic_email,
        clinic_website: clinicDetails.clinic_website,
        clinic_address: clinicDetails.clinic_address,
        status: kind,
      });

      toast.success("Email sent successfully");
    } catch {
      toast.error("Email failed");
    }
  };

  const onConfirm = async (a: Appt) => {
    await updateStatus(a, "confirmed");
    await sendEmailFor(a, "confirmed");
  };

  const onCancel = async (a: Appt) => {
    await updateStatus(a, "cancelled");
    await sendEmailFor(a, "cancelled");
  };

  const onSaveReschedule = async () => {
    if (!editing) return;

    await updateDoc(doc(db, "appointments", editing.id), {
      appointmentDate: editDate,
      appointmentTime: editTime,
      status: "rescheduled",
    });

    toast.success("Appointment rescheduled");

    await sendEmailFor(editing, "rescheduled", {
      date: editDate,
      time: editTime,
    });

    setEditing(null);
  };

  const onDelete = async () => {
    if (!deleting) return;

    await deleteDoc(doc(db, "appointments", deleting.id));
    toast.success("Appointment deleted");
    setDeleting(null);
  };

  const openWhatsApp = (
    a: Appt,
    kind: "confirmed" | "rescheduled" | "cancelled",
    overrides?: { date?: string; time?: string }
  ) => {
    const rawDate = overrides?.date ?? a.appointmentDate;
    const date = formatIndianDate(rawDate);
    const time = overrides?.time ?? a.appointmentTime;

    const msg =
      kind === "confirmed"
        ? confirmationMessage(DOCTOR)
        : kind === "rescheduled"
        ? rescheduleMessage(date, time, DOCTOR)
        : cancelMessage(DOCTOR);

    window.open(whatsappLink(a.patientPhone, msg), "_blank");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground mt-1">
              Manage, confirm, reschedule, and cancel patient appointments.
            </p>
          </div>

          {!isEmailConfigured && (
            <p className="text-xs text-muted-foreground">
              EmailJS not configured — emails will be logged.
            </p>
          )}
        </div>

        <Card className="shadow-card">
          <CardContent className="p-4 grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border bg-muted/40">
                <tr>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      No appointments match your filters.
                    </td>
                  </tr>
                )}

                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4 font-medium">{a.patientName}</td>

                    <td className="py-3 px-4 text-xs">
                      <div>{a.patientEmail}</div>
                      <div className="text-muted-foreground">
                        {a.patientPhone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {formatIndianDate(a.appointmentDate)}{" "}
                      <span className="text-muted-foreground">
                        @ {a.appointmentTime}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {a.hospitalLocation ?? "—"}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={a.status ?? "pending"} />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end flex-wrap">
                        <Button size="sm" variant="ghost" title="WhatsApp" onClick={() => openWhatsApp(a, a.status === "cancelled" ? "cancelled" : a.status === "rescheduled" ? "rescheduled" : "confirmed")}>
                          <MessageCircle className="h-4 w-4 text-success" />
                        </Button>

                        <Button size="sm" variant="ghost" title="Email" onClick={() => sendEmailFor(a, "confirmed")}>
                          <Mail className="h-4 w-4 text-primary" />
                        </Button>

                        {a.status !== "confirmed" && (
                          <Button size="sm" variant="ghost" title="Confirm" onClick={() => onConfirm(a)}>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </Button>
                        )}

                        <Button size="sm" variant="ghost" title="Reschedule" onClick={() => { setEditing(a); setEditDate(a.appointmentDate); setEditTime(a.appointmentTime); }}>
                          <Pencil className="h-4 w-4 text-accent" />
                        </Button>

                        {a.status !== "cancelled" && (
                          <Button size="sm" variant="ghost" title="Cancel" onClick={() => onCancel(a)}>
                            <XCircle className="h-4 w-4 text-warning" />
                          </Button>
                        )}

                        <Button size="sm" variant="ghost" title="Delete" onClick={() => setDeleting(a)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>
              Update date and time. The patient will be notified by email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={onSaveReschedule}>Save & Notify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}