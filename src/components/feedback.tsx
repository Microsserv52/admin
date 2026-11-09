"use client";
import { Alert, Button, CircularProgress } from "@mui/material";
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="feedback" role="status">
      <CircularProgress size={24} />
      <span>{label}</span>
    </div>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        retry && (
          <Button color="inherit" onClick={retry}>
            Retry
          </Button>
        )
      }
    >
      {error.message}
    </Alert>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
