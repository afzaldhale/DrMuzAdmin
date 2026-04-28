import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "rescheduled" | "completed";

const map: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  rescheduled: "bg-accent/15 text-accent border-accent/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  draft: "bg-muted text-muted-foreground border-border",
  published: "bg-success/15 text-success border-success/30",
  new: "bg-warning/15 text-warning border-warning/30",
  contacted: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", map[status] ?? "")}>
      {status}
    </Badge>
  );
}
