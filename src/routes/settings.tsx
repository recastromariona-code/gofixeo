import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/settings")({
  component: SettingsRedirect,
});

function SettingsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/profile", replace: true });
  }, [navigate]);

  return null;
}
