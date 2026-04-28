import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MessageSquare, Search, Trash2, CheckCircle2 } from "lucide-react";
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  message: string;
  status?: string;
  createdAt?: any;
}

export default function AdminInquiries() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Inquiry | null>(null);

  const load = async () => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "inquiries"), orderBy("createdAt", "desc"))).catch(() => getDocs(collection(db, "inquiries")));
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((i) => !search || `${i.name} ${i.email} ${i.phone} ${i.message}`.toLowerCase().includes(search.toLowerCase()));

  const markContacted = async (i: Inquiry) => {
    await updateDoc(doc(db, "inquiries", i.id), { status: "contacted" });
    toast.success("Marked as contacted"); load();
  };
  const onDelete = async () => {
    if (!deleting) return;
    await deleteDoc(doc(db, "inquiries", deleting.id));
    toast.success("Deleted"); setDeleting(null); load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Patient Inquiries</h1><p className="text-muted-foreground mt-1">Messages from your contact form.</p></div>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search inquiries…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />No inquiries.
            </CardContent></Card>
          )}
          {filtered.map((i) => (
            <Card key={i.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-base">{i.name}</h3>
                    <p className="text-xs text-muted-foreground">{i.email} {i.phone && `• ${i.phone}`}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={i.status ?? "new"} />
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap mt-3">{i.message}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {i.createdAt?.toDate?.()?.toLocaleString?.() ?? ""}
                  </p>
                  <div className="flex gap-2">
                    {i.status !== "contacted" && (
                      <Button size="sm" variant="outline" onClick={() => markContacted(i)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark contacted
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete inquiry?</AlertDialogTitle><AlertDialogDescription>This is permanent.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
