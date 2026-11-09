import { Button } from "@mui/material";
import { Shell } from "@/components/shell";
export default function NotFound() {
  return (
    <Shell>
      <div className="container narrow">
        <h1>Page not found.</h1>
        <p>
          This page may have moved. The demo catalog is a good place to start.
        </p>
        <Button href="/store/" variant="contained">
          Browse demo catalog
        </Button>
      </div>
    </Shell>
  );
}
