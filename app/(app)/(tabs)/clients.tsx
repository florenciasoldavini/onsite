import { RouteLoadingScreen } from "@/shared/route-loading-screen";
import { lazy, Suspense } from "react";

const ClientsScreen = lazy(
  () => import("@/features/clients/screens/clients-screen")
);

export default function Clients() {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <ClientsScreen />
    </Suspense>
  );
}
