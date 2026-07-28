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

const appleLogo = require("@/assets/images/auth/apple-logo.png");
const googleLogo = require("@/assets/images/auth/google-logo.png");

type IdentityProvider = "apple" | "email" | "google";

const providerCopy = {
  apple: {
    label: "Apple",
    supporting: "Apple account"
  },
  email: {
    label: "Email",
    supporting: "Password access"
  },
  google: {
    label: "Google",
    supporting: "Google account"
  }
} satisfies Record<IdentityProvider, { label: string; supporting: string }>;

export function ProfileIdentityMethodsTab({
  returnedLinkProvider
}: {
  returnedLinkProvider: SupportedOAuthProvider | null;
}) {
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
          `${getOAuthProviderLabel(returnedLinkProvider)} sign-in linked.`
        );
      } else if (refreshedIdentities) {
        setIdentityError(
          `We couldn't confirm the ${getOAuthProviderLabel(returnedLinkProvider)} link. Try again.`
        );
      }

      router.setParams({ identity_link_check: undefined });
    };

    void confirmLinkedIdentity();

    return () => {
      isMounted = false;
    };
  }, [refreshIdentities, returnedLinkProvider, router]);

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
        setIdentityStatus(`${getOAuthProviderLabel(provider)} sign-in linked.`);
      } else {
        setIdentityError(
          `We couldn't confirm the ${getOAuthProviderLabel(provider)} link. Try again.`
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
          <AppText variant="label">Sign-In Methods</AppText>
          <AppText tone="muted">Connected access</AppText>
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
            Connecting {getOAuthProviderLabel(linkingProvider)}...
          </FieldMessage>
        ) : identityLoading ? (
          <FieldMessage>Checking linked methods...</FieldMessage>
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
  const copy = providerCopy[provider];

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
            Linked
          </AppText>
        </View>
      ) : onLink && provider !== "email" ? (
        <AppButton
          accessibilityLabel={`Link ${copy.label} sign-in`}
          fullWidth={false}
          isDisabled={isActionDisabled}
          loading={isLoading}
          onPress={onLink}
          size="sm"
          variant="bordered"
        >
          Link
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
