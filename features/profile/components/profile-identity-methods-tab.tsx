import {
  getOAuthProviderLabel,
  isIdentityProviderLinked,
  type SupportedOAuthProvider
} from "@/features/auth/utils/auth-callback";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useLinkProfileIdentity,
  useProfileUserIdentities
} from "@/features/profile/hooks/use-profile-avatar";
import { getSupabaseErrorMessage } from "@/infrastructure/supabase/client";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { FieldMessage } from "@/shared/ui/components/field-message";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { CheckCircleIcon, MailIcon } from "@/shared/ui/icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

const appleLogo = require("@/assets/images/auth/apple-logo.png");
const googleLogo = require("@/assets/images/auth/google-logo.png");

type IdentityProvider = "apple" | "email" | "google";

export function ProfileIdentityMethodsTab({
  returnedLinkProvider
}: {
  returnedLinkProvider: SupportedOAuthProvider | null;
}) {
  const { t } = useTranslation("features/profile");
  const { session } = useAuth();
  const router = useRouter();
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState<string | null>(null);
  const {
    data: identities = [],
    error: identitiesQueryError,
    isFetching,
    isLoading,
    refetch
  } = useProfileUserIdentities(Boolean(session));
  const linkIdentityMutation = useLinkProfileIdentity();
  const identityLoading = isLoading || isFetching;
  const displayedIdentityError =
    identityError ??
    (identitiesQueryError
      ? getSupabaseErrorMessage(identitiesQueryError)
      : null);
  const linkingProvider = linkIdentityMutation.isPending
    ? (linkIdentityMutation.variables ?? null)
    : null;
  const linkedProviders = useMemo(
    () =>
      new Set(
        identities.map((identity) => identity.provider.toLowerCase())
      ),
    [identities]
  );

  const refreshIdentities = useCallback(async () => {
    if (!session) {
      return [];
    }

    setIdentityError(null);

    try {
      const result = await refetch();

      if (result.error) {
        throw result.error;
      }

      return result.data ?? [];
    } catch (error) {
      setIdentityError(getSupabaseErrorMessage(error));
      return null;
    }
  }, [refetch, session]);

  useEffect(() => {
    if (!returnedLinkProvider) {
      return;
    }

    let isMounted = true;
    setIdentityError(null);
    setIdentityStatus(null);

    const confirmLinkedIdentity = async () => {
      const refreshedIdentities = await refreshIdentities();

      if (!isMounted) {
        return;
      }

      if (
        refreshedIdentities &&
        isIdentityProviderLinked(refreshedIdentities, returnedLinkProvider)
      ) {
        setIdentityStatus(
          t(($) => $["features/profile"].methods.linkedStatus, {
            provider: getOAuthProviderLabel(returnedLinkProvider)
          })
        );
      } else if (refreshedIdentities) {
        setIdentityError(
          t(($) => $["features/profile"].methods.linkError, {
            provider: getOAuthProviderLabel(returnedLinkProvider)
          })
        );
      }

      router.setParams({ identity_link_check: undefined });
    };

    void confirmLinkedIdentity();

    return () => {
      isMounted = false;
    };
  }, [refreshIdentities, returnedLinkProvider, router, t]);

  const linkOAuthProvider = async (provider: SupportedOAuthProvider) => {
    if (linkedProviders.has(provider) || linkingProvider) {
      return;
    }

    setIdentityError(null);
    setIdentityStatus(null);

    try {
      await linkIdentityMutation.mutateAsync(provider);
      const refreshedIdentities = await refreshIdentities();

      if (!refreshedIdentities) {
        return;
      }

      if (isIdentityProviderLinked(refreshedIdentities, provider)) {
        setIdentityStatus(
          t(($) => $["features/profile"].methods.linkedStatus, {
            provider: getOAuthProviderLabel(provider)
          })
        );
      } else {
        setIdentityError(
          t(($) => $["features/profile"].methods.linkError, {
            provider: getOAuthProviderLabel(provider)
          })
        );
      }
    } catch (error) {
      setIdentityError(getSupabaseErrorMessage(error));
    }
  };

  return (
    <AppCard padding="lg">
      <View style={styles.content}>
        <View style={styles.heading}>
          <AppText variant="label">
            {t(($) => $["features/profile"].methods.title)}
          </AppText>
          <AppText tone="muted">
            {t(($) => $["features/profile"].methods.connected)}
          </AppText>
        </View>

        <View style={styles.methods}>
          <IdentityMethodRow
            isLinked={linkedProviders.has("email")}
            provider="email"
          />
          <IdentityMethodRow
            isActionDisabled={identityLoading || linkingProvider !== null}
            isLinked={linkedProviders.has("google")}
            isLoading={linkingProvider === "google"}
            onLink={() => void linkOAuthProvider("google")}
            provider="google"
          />
          <IdentityMethodRow
            isActionDisabled={identityLoading || linkingProvider !== null}
            isLinked={linkedProviders.has("apple")}
            isLoading={linkingProvider === "apple"}
            onLink={() => void linkOAuthProvider("apple")}
            provider="apple"
          />
        </View>

        {linkingProvider ? (
          <FieldMessage>
            {t(($) => $["features/profile"].methods.connecting, {
              provider: getOAuthProviderLabel(linkingProvider)
            })}
          </FieldMessage>
        ) : identityLoading ? (
          <FieldMessage>
            {t(($) => $["features/profile"].methods.checking)}
          </FieldMessage>
        ) : null}
        {identityStatus ? (
          <FieldMessage tone="success">{identityStatus}</FieldMessage>
        ) : null}
        {displayedIdentityError ? (
          <FieldMessage tone="error">{displayedIdentityError}</FieldMessage>
        ) : null}
      </View>
    </AppCard>
  );
}

function IdentityMethodRow({
  isActionDisabled = false,
  isLinked,
  isLoading = false,
  onLink,
  provider
}: {
  isActionDisabled?: boolean;
  isLinked: boolean;
  isLoading?: boolean;
  onLink?: () => void;
  provider: IdentityProvider;
}) {
  const { t } = useTranslation("features/profile");
  const copy =
    provider === "apple"
      ? {
          label: t(($) => $["features/profile"].methods.apple),
          supporting: t(
            ($) => $["features/profile"].methods.appleSupporting
          )
        }
      : provider === "google"
        ? {
            label: t(($) => $["features/profile"].methods.google),
            supporting: t(
              ($) => $["features/profile"].methods.googleSupporting
            )
          }
        : {
            label: t(($) => $["features/profile"].methods.email),
            supporting: t(
              ($) => $["features/profile"].methods.emailSupporting
            )
          };

  return (
    <View style={styles.method}>
      <View style={styles.methodCopy}>
        <ProviderIcon provider={provider} />
        <View style={styles.methodText}>
          <AppText>{copy.label}</AppText>
          <AppText tone="muted" variant="bodySm">
            {copy.supporting}
          </AppText>
        </View>
      </View>

      {isLinked ? (
        <View style={styles.linked}>
          <CheckCircleIcon color={atomPalette.successText} size="sm" />
          <AppText tone="success" variant="label">
            {t(($) => $["features/profile"].methods.linked)}
          </AppText>
        </View>
      ) : onLink && provider !== "email" ? (
        <AppButton
          accessibilityLabel={t(
            ($) => $["features/profile"].methods.linkAccessibility,
            { provider: copy.label }
          )}
          fullWidth={false}
          isDisabled={isActionDisabled}
          loading={isLoading}
          onPress={onLink}
          size="sm"
          variant="bordered"
        >
          {t(($) => $["features/profile"].methods.link)}
        </AppButton>
      ) : null}
    </View>
  );
}

function ProviderIcon({ provider }: { provider: IdentityProvider }) {
  if (provider === "google" || provider === "apple") {
    return (
      <Image
        source={provider === "google" ? googleLogo : appleLogo}
        style={styles.providerIcon}
      />
    );
  }

  return <MailIcon color={atomPalette.textMuted} size="lg" />;
}

const styles = StyleSheet.create({
  content: {
    gap: atomSpacing[5]
  },
  heading: {
    gap: atomSpacing[1]
  },
  linked: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[1]
  },
  method: {
    alignItems: "center",
    borderColor: atomPalette.border,
    borderRadius: atomRadii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: atomSpacing[3],
    justifyContent: "space-between",
    padding: atomSpacing[4]
  },
  methodCopy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: atomSpacing[3]
  },
  methods: {
    gap: atomSpacing[3]
  },
  methodText: {
    flex: 1,
    gap: atomSpacing[1]
  },
  providerIcon: {
    height: 24,
    resizeMode: "contain",
    width: 24
  }
});
