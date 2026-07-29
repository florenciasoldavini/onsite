import { RouteFeedback } from "@/shared/ui/components/route-feedback";
import { useRouter } from "expo-router";

export default function NotFoundRoute() {
  const router = useRouter();

  return (
    <RouteFeedback
      action={{
        label: "Go to Onzait",
        onPress: () => router.replace("/")
      }}
      description="The page you requested does not exist or the link is no longer valid."
      kind="not-found"
      resourceName="page"
      title="Page not found"
    />
  );
}
