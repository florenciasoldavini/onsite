import { useClient } from "@/features/clients/hooks/use-clients";
import { getClientDisplayName } from "@/features/clients/schemas/client.schema";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { MailIcon, PhoneIcon } from "@/shared/ui/icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

export function ProjectClientCard({
  clientQuery
}: {
  clientQuery: ReturnType<typeof useClient>;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/projects");
  const { t: tShared } = useTranslation("shared");

  if (clientQuery.isLoading) {
    return <SkeletonBlock height={126} />;
  }

  if (clientQuery.isError) {
    return (
      <AppCard padding="md" tone="muted">
        <View style={{ gap: atomSpacing[3] }}>
          <AppHeading variant="card">
            {t(($) => $["features/projects"].detail.clientUnavailable)}
          </AppHeading>
          <AppText tone="muted">
            {t(($) => $["features/projects"].detail.clientLoad)}
          </AppText>
          <AppButton
            color="neutral"
            fullWidth={false}
            onPress={() => void clientQuery.refetch()}
            size="sm"
            variant="bordered"
          >
            {tShared(($) => $.shared.actions.retry)}
          </AppButton>
        </View>
      </AppCard>
    );
  }

  if (!clientQuery.data) {
    return null;
  }

  const client = clientQuery.data;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/clients/${client.id}` as never)}
    >
      <AppCard padding="md">
        <View style={{ gap: atomSpacing[3] }}>
          <AppText tone="accent" variant="eyebrow">
            {t(($) => $["features/projects"].detail.client).toUpperCase()}
          </AppText>
          <AppHeading variant="card">{getClientDisplayName(client)}</AppHeading>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: atomSpacing[4]
            }}
          >
            <ProjectClientContact
              icon={PhoneIcon}
              value={
                client.phone_number ??
                t(($) => $["features/projects"].detail.noPhone)
              }
            />
            <ProjectClientContact
              icon={MailIcon}
              value={
                client.email ??
                t(($) => $["features/projects"].detail.noEmail)
              }
            />
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

function ProjectClientContact({
  icon: Icon,
  value
}: {
  icon: typeof PhoneIcon;
  value: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: atomSpacing[2]
      }}
    >
      <Icon color={atomPalette.textMuted} size="sm" />
      <AppText tone="muted" variant="bodySm">
        {value}
      </AppText>
    </View>
  );
}
