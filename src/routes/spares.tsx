import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SparesBasketProvider } from "@/components/SparesBasket";

export const Route = createFileRoute("/spares")({
  component: SparesLayout,
});

function SparesLayout() {
  return (
    <SparesBasketProvider>
      <Outlet />
    </SparesBasketProvider>
  );
}
