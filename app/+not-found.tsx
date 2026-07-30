import { RouteFeedback } from "@/shared/ui/components/route-feedback";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function NotFoundRoute() {
  const router = useRouter();
  const { t } = useTranslation("shared");

  return (
    <RouteFeedback
      action={{
        label: t(($) => $.shared.feedback.pageAction),
        onPress: () => router.replace("/")
      }}
      description={t(($) => $.shared.feedback.pageDescription)}
      kind="not-found"
      resourceName="page"
      title={t(($) => $.shared.feedback.pageTitle)}
    />
  );
}
