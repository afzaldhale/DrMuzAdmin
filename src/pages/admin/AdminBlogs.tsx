import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FileText, Upload, Loader2 } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "@/lib/firebase";
import { toast } from "sonner";

interface Blog {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  status: "draft" | "published";
  slug?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const empty: Omit<Blog, "id"> = { title: "", content: "", category: "", imageUrl: "", status: "draft" };
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getFirebaseErrorMessage(error: unknown, fallback: string) {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code === "permission-denied") return "You do not have permission to access blogs.";
  if (code === "unauthenticated") return "Your admin session has expired. Please sign in again.";
  if (code === "failed-precondition") return "Unable to load blogs. A Firestore index may be required.";
  if (code === "unavailable" || code === "network-request-failed") return "Unable to reach Firebase. Please try again.";
  return getErrorMessage(error, fallback);
}

function generateSlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getCreatedAtTime(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") return new Date(value).getTime();
  return 0;
}

export default function AdminBlogs() {
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState<Omit<Blog, "id">>(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Blog | null>(null);

  const load = async () => {
    if (!isFirebaseConfigured) {
      setError("Firebase is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "blogs"));
      const blogs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Blog, "id">) }));
      setItems(blogs.sort((a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt)));
    } catch (loadError) {
      console.error("Failed to load blogs", loadError);
      setError(getFirebaseErrorMessage(loadError, "Unable to load blogs. Please try again."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); };
  const openEdit = (b: Blog) => { setEditing(b); const { id, ...rest } = b; setForm(rest); };

  const onUpload = async (file: File) => {
    if (!isFirebaseConfigured) return toast.error("Firebase not configured");
    setUploading(true);
    try {
      const r = ref(storage, `blogs/${Date.now()}-${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Image uploaded");
    } catch (error) { toast.error(getFirebaseErrorMessage(error, "Upload failed")); }
    finally { setUploading(false); }
  };

  const onSave = async (status?: "draft" | "published") => {
    if (!isFirebaseConfigured) return toast.error("Firebase not configured");
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const data = { ...form, slug: generateSlug(form.title), status: status ?? form.status };
      if (editing) {
        await updateDoc(doc(db, "blogs", editing.id), { ...data, updatedAt: serverTimestamp() });
        toast.success("Blog updated");
      } else {
        const timestamp = serverTimestamp();
        await addDoc(collection(db, "blogs"), { ...data, createdAt: timestamp, updatedAt: timestamp });
        toast.success("Blog created");
      }
      setEditing(null); setForm(empty); await load();
    } catch (error) { toast.error(getFirebaseErrorMessage(error, "Save failed")); }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDoc(doc(db, "blogs", deleting.id));
      toast.success("Blog deleted");
      setDeleting(null);
      await load();
    } catch (error) {
      console.error("Failed to delete blog", error);
      toast.error(getFirebaseErrorMessage(error, "Delete failed"));
    }
  };

  const showForm = editing !== null || form !== empty;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div><h1 className="text-3xl font-bold">Blogs</h1><p className="text-muted-foreground mt-1">Create, edit, and publish articles.</p></div>
          <Dialog onOpenChange={(o) => { if (o) openCreate(); }}>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Blog</Button>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border bg-muted/40">
                <tr><th className="py-3 px-4">Title</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Loading…</td></tr>}
                {!loading && error && (
                  <tr><td colSpan={4} className="py-12 text-center text-destructive">
                    <p>{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={load}>Retry</Button>
                  </td></tr>
                )}
                {!loading && !error && items.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No blogs yet. Create your first article.
                  </td></tr>
                )}
                {items.map((b) => (
                  <tr key={b.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium flex items-center gap-3">
                      {b.imageUrl && <img src={b.imageUrl} alt="" className="h-9 w-9 rounded object-cover" />}
                      <span className="line-clamp-1">{b.title}</span>
                    </td>
                    <td className="py-3 px-4">{b.category || "—"}</td>
                    <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(b)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setEditing(null); setForm(empty); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit blog" : "New blog"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Cardiology" /></div>
            <div className="space-y-2">
              <Label>Cover image</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-muted text-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                </label>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />}
              </div>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your article…" /></div>
            {form.imageUrl || form.content ? (
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <p className="text-xs uppercase text-muted-foreground mb-2 font-semibold">Preview</p>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="rounded mb-3 max-h-48 object-cover w-full" />}
                <h3 className="font-bold text-lg">{form.title || "Untitled"}</h3>
                <p className="text-sm whitespace-pre-wrap mt-2">{form.content}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onSave("draft")} disabled={saving}>Save Draft</Button>
            <Button onClick={() => onSave("published")} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete blog?</AlertDialogTitle><AlertDialogDescription>This is permanent.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
