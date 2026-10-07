import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  component: RegisterLayout,
});

function RegisterLayout() {
  return <Outlet />;
}
