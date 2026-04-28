import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, CheckCircle2, XCircle, MessageSquare, FileText, Users, Plus } from "lucide-react";
import { collection, orderBy, query, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Link } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Appt { id: string; patientName: string; appointmentDate: string; appointmentTime: string; status: string; hospitalLocation?: string; createdAt?: any; }
interface Inquiry { id: string; name: string; message: string; status?: string; createdAt?: any; }
interface Blog { id: string; title: string; status: string; }

export default function AdminDashboard() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    setLoading(true);
    const unsubAppts = onSnapshot(
      query(collection(db, "appointments"), orderBy("createdAt", "desc")),
      (snap) => setAppts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    const unsubInquiries = onSnapshot(
      collection(db, "inquiries"),
      (snap) => setInquiries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    const unsubBlogs = onSnapshot(
      collection(db, "blogs"),
      (snap) => setBlogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    setLoading(false);
    return () => { unsubAppts(); unsubInquiries(); unsubBlogs(); };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todays = appts.filter((a) => a.appointmentDate === today);
  const pending = appts.filter((a) => a.status === "pending").length;
  const confirmed = appts.filter((a) => a.status === "confirmed").length;
  const cancelled = appts.filter((a) => a.status === "cancelled").length;
  const publishedBlogs = blogs.filter((b) => b.status === "published").length;

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    appts.forEach((a) => { if (a.appointmentDate) map[a.appointmentDate] = (map[a.appointmentDate] || 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), count,
    }));
  }, [appts]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of clinic activity</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/admin/appointments"><CalendarCheck className="h-4 w-4 mr-2" />Appointments</Link></Button>
            <Button asChild><Link to="/admin/blogs"><Plus className="h-4 w-4 mr-2" />New Blog</Link></Button>
          </div>
        </div>

        {!isFirebaseConfigured && (
          <Card className="border-warning/30 bg-warning/5"><CardContent className="p-4 text-sm">
            Firebase not configured — showing empty state. Add <code>VITE_FIREBASE_*</code> env vars and restart.
          </CardContent></Card>
        )}

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's Appointments" value={todays.length} icon={Clock} tone="primary" />
          <StatCard label="Total Appointments" value={appts.length} icon={CalendarCheck} tone="accent" />
          <StatCard label="Pending" value={pending} icon={Clock} tone="warning" />
          <StatCard label="Confirmed" value={confirmed} icon={CheckCircle2} tone="success" />
          <StatCard label="Cancelled" value={cancelled} icon={XCircle} tone="destructive" />
          <StatCard label="Inquiries" value={inquiries.length} icon={MessageSquare} tone="accent" />
          <StatCard label="Published Blogs" value={publishedBlogs} icon={FileText} tone="primary" />
          <StatCard label="Total Blogs" value={blogs.length} icon={Users} tone="accent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader><CardTitle>Appointments — last 7 dates</CardTitle></CardHeader>
            <CardContent className="h-72">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle>Recent Inquiries</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {inquiries.slice(0, 5).map((i) => (
                <div key={i.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{i.name}</p>
                    <StatusBadge status={i.status ?? "new"} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.message}</p>
                </div>
              ))}
              {inquiries.length === 0 && <p className="text-sm text-muted-foreground">No inquiries yet.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader><CardTitle>Recent Appointments</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="py-3 pr-4">Patient</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Time</th><th className="py-3 pr-4">Location</th><th className="py-3 pr-4">Status</th></tr>
              </thead>
              <tbody>
                {appts.slice(0, 8).map((a) => (
                  <tr key={a.id} className="border-b border-border/60 hover:bg-muted/40">
                    <td className="py-3 pr-4 font-medium">{a.patientName}</td>
                    <td className="py-3 pr-4">{a.appointmentDate}</td>
                    <td className="py-3 pr-4">{a.appointmentTime}</td>
                    <td className="py-3 pr-4">{a.hospitalLocation ?? "—"}</td>
                    <td className="py-3 pr-4"><StatusBadge status={a.status ?? "pending"} /></td>
                  </tr>
                ))}
                {!loading && appts.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No appointments yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
