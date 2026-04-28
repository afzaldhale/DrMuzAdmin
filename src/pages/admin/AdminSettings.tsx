import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { toast } from "sonner";

interface Settings {
  doctorName: string;
  clinicName: string;
  whatsappNumber: string;
  doctorEmail: string;
  consultStart: string;
  consultEnd: string;
  slotDuration: number;
  hospitalLocations: string[];
}

const DEFAULTS: Settings = {
  doctorName: "Dr. Muzammil Ambekar",
  clinicName: "Dr. Muzammil Ambekar Clinic",
  whatsappNumber: "",
  doctorEmail: "",
  consultStart: "09:00",
  consultEnd: "18:00",
  slotDuration: 30,
  hospitalLocations: [],
};

export default function AdminSettings() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isFirebaseConfigured) { setLoading(false); return; }
      try {
        const d = await getDoc(doc(db, "settings", "clinic"));
        if (d.exists()) setS({ ...DEFAULTS, ...(d.data() as any) });
      } finally { setLoading(false); }
    })();
  }, []);

  const onSave = async () => {
    if (!isFirebaseConfigured) return toast.error("Firebase not configured");
    if (!s.doctorEmail) return toast.error("Doctor email is required");
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "clinic"), s, { merge: true });
      toast.success("Settings saved");
    } catch (e: any) { toast.error(e?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const addLocation = () => setS({ ...s, hospitalLocations: [...s.hospitalLocations, ""] });
  const updateLocation = (i: number, v: string) => {
    const arr = [...s.hospitalLocations]; arr[i] = v; setS({ ...s, hospitalLocations: arr });
  };
  const removeLocation = (i: number) => setS({ ...s, hospitalLocations: s.hospitalLocations.filter((_, x) => x !== i) });

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div><h1 className="text-3xl font-bold">Settings</h1><p className="text-muted-foreground mt-1">Clinic configuration and preferences.</p></div>

        <Card className="shadow-card">
          <CardHeader><CardTitle>Doctor & Clinic</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Doctor name</Label><Input value={s.doctorName} onChange={(e) => setS({ ...s, doctorName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Clinic name</Label><Input value={s.clinicName} onChange={(e) => setS({ ...s, clinicName: e.target.value })} /></div>
            <div className="space-y-2"><Label>WhatsApp number</Label><Input value={s.whatsappNumber} onChange={(e) => setS({ ...s, whatsappNumber: e.target.value })} placeholder="+919876543210" /></div>
            <div className="space-y-2"><Label>Doctor email <span className="text-destructive">*</span></Label><Input type="email" value={s.doctorEmail} onChange={(e) => setS({ ...s, doctorEmail: e.target.value })} required /></div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle>Consultation hours</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Start time</Label><Input type="time" value={s.consultStart} onChange={(e) => setS({ ...s, consultStart: e.target.value })} /></div>
            <div className="space-y-2"><Label>End time</Label><Input type="time" value={s.consultEnd} onChange={(e) => setS({ ...s, consultEnd: e.target.value })} /></div>
            <div className="space-y-2"><Label>Slot (mins)</Label><Input type="number" min={5} step={5} value={s.slotDuration} onChange={(e) => setS({ ...s, slotDuration: Number(e.target.value) })} /></div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hospital locations</CardTitle>
            <Button size="sm" variant="outline" onClick={addLocation}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.hospitalLocations.length === 0 && <p className="text-sm text-muted-foreground">No locations added yet.</p>}
            {s.hospitalLocations.map((loc, i) => (
              <div key={i} className="flex gap-2">
                <Input value={loc} onChange={(e) => updateLocation(i, e.target.value)} placeholder="Hospital / clinic name & area" />
                <Button variant="ghost" size="icon" onClick={() => removeLocation(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
