import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl gradient-primary items-center justify-center shadow-elevated mb-6">
          <Stethoscope className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">Dr. Muzammil Ambekar Clinic</h1>
        <p className="text-muted-foreground mb-8">Patient site lives elsewhere. This deployment hosts the secure admin portal.</p>
        <Button asChild size="lg" className="gap-2">
          <Link to="/admin/login">Open Admin Portal <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
