import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] mono">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
