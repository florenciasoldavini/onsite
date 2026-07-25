import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { FieldMessage } from "@/shared/ui/components/field-message";
import {
  PasswordVisibilityToggle,
  TextField
} from "@/shared/ui/components/input";
import { NavScreenHeader } from "@/shared/ui/components/nav-screen-header";
import { Screen } from "@/shared/ui/components/screen";
import { SegmentedTabs } from "@/shared/ui/components/tabs";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomRadii, atomSpacing } from "@/shared/ui/components/theme";
import { authCardMaxWidth } from "@/features/auth/components/auth-shell";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import {
  CameraIcon,
  CheckCircleIcon,
  LockIcon,
  LogoutIcon,
  MailIcon,
  PhoneIcon,
  UserIcon
} from "@/shared/ui/icons";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useChangeProfilePassword,
  useLinkProfileIdentity,
  useProfileAvatarUrl,
  useProfileUserIdentities
} from "@/features/profile/hooks/use-profile-avatar";
import type { ProfileAvatarAsset } from "@/features/profile/repositories/profile-avatar.repository";
import {
  profileInfoSchema,
  profilePasswordSchema,
  type ProfileInfoInput,
  type ProfilePasswordInput
} from "@/features/profile/schemas/profile.schemas";
import {
  getOAuthProviderLabel,
  getSupportedOAuthProvider,
  isIdentityProviderLinked,
  type SupportedOAuthProvider
} from "@/features/auth/utils/auth-callback";
import { getSupabaseErrorMessage } from "@/infrastructure/supabase/client";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle
} from "react-native";

const appleLogo = require("@/assets/images/auth/apple-logo.png");
const googleLogo = require("@/assets/images/auth/google-logo.png");

type IdentityProvider = "apple" | "email" | "google";
type ProfileTab = "profile" | "security" | "methods";

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

const profileTabs = [
  { value: "profile", label: "Profile" },
  { value: "security", label: "Security" },
  { value: "methods", label: "Sign-In" }
] satisfies { value: ProfileTab; label: string }[];

function getProfileInfoDefaults(
  profile:
    | {
        avatar?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        phone_number?: string | null;
      }
    | null
    | undefined
): ProfileInfoInput {
  return {
    avatar: profile?.avatar ?? "",
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    phoneNumber: profile?.phone_number ?? ""
  };
}
export default function ProfileScreen() {
  const { logOut, session, updateUserProfile, user } = useAuth();
  const { isExpanded } = useLayoutMode();
  const router = useRouter();
  const { identity_link_check: identityLinkCheckParam } = useLocalSearchParams<{
    identity_link_check?: string | string[];
  }>();
  const returnedLinkProvider = getSupportedOAuthProvider(
    identityLinkCheckParam
  );
  const [avatarAsset, setAvatarAsset] = useState<ProfileAvatarAsset | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const {
    data: identities = [],
    error: identitiesQueryError,
    isFetching: identitiesFetching,
    isLoading: identitiesInitialLoading,
    refetch: refetchIdentities
  } = useProfileUserIdentities(Boolean(session));
  const linkIdentityMutation = useLinkProfileIdentity();
  const changePasswordMutation = useChangeProfilePassword();
  const profileForm = useForm<ProfileInfoInput>({
    defaultValues: getProfileInfoDefaults(user),
    mode: "onChange",
    resolver: zodResolver(profileInfoSchema)
  });
  const securityForm = useForm<ProfilePasswordInput>({
    defaultValues: {
      confirmPassword: "",
      password: ""
    },
    mode: "onChange",
    resolver: zodResolver(profilePasswordSchema)
  });
  const {
    control: profileControl,
    formState: { isDirty: isProfileDirty, isValid: isProfileValid },
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    watch: watchProfileField
  } = profileForm;
  const {
    control: passwordControl,
    formState: { isValid: isPasswordChangeValid },
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm
  } = securityForm;
  const avatar = watchProfileField("avatar");
  const {
    data: avatarDisplayUrl = null,
    error: avatarDisplayError,
    isLoading: avatarDisplayLoading
  } = useProfileAvatarUrl(avatar);
  const isProfileSaving = isSaving;
  const isProfileSaveDisabled =
    isProfileSaving || !isProfileValid || (!isProfileDirty && !avatarAsset);
  const identityLoading = identitiesInitialLoading || identitiesFetching;
  const displayedIdentityError =
    identityError ??
    (identitiesQueryError
      ? getSupabaseErrorMessage(identitiesQueryError)
      : null);
  const linkingProvider = linkIdentityMutation.isPending
    ? (linkIdentityMutation.variables ?? null)
    : null;
  const isUpdatingPassword = changePasswordMutation.isPending;

  const linkedProviders = useMemo(() => {
    return new Set(
      identities.map((identity) => identity.provider.toLowerCase())
    );
  }, [identities]);

  const refreshIdentities = useCallback(async () => {
    if (!session) {
      return [];
    }

    setIdentityError(null);

    try {
      const result = await refetchIdentities();

      if (result.error) {
        throw result.error;
      }

      return result.data ?? [];
    } catch (error) {
      setIdentityError(getSupabaseErrorMessage(error));
      return null;
    }
  }, [refetchIdentities, session]);

  useEffect(() => {
    setAvatarAsset(null);
    resetProfileForm(getProfileInfoDefaults(user));
    resetPasswordForm({
      confirmPassword: "",
      password: ""
    });
    setFormError(null);
    setStatusMessage(null);
    setSecurityError(null);
    setSecurityStatus(null);
  }, [
    session?.user.email,
    user?.avatar,
    user?.email,
    user?.first_name,
    user?.last_name,
    user?.phone_number,
    resetProfileForm,
    resetPasswordForm
  ]);

  useEffect(() => {
    if (!returnedLinkProvider) {
      return;
    }

    let isMounted = true;
    setActiveTab("methods");
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

  const saveProfile = handleProfileSubmit(async (values) => {
    if (!user) {
      setFormError("You must be signed in to update your profile.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setStatusMessage(null);

    try {
      const updatedUser = await updateUserProfile(
        {
          avatar: values.avatar,
          first_name: values.firstName.trim(),
          last_name: values.lastName,
          phone_number: values.phoneNumber
        },
        avatarAsset
      );

      if (updatedUser) {
        setAvatarAsset(null);
        resetProfileForm(getProfileInfoDefaults(updatedUser));
        setStatusMessage("Profile updated");
      }
    } catch (error) {
      setFormError(getSupabaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  });

  const changePassword = handlePasswordSubmit(async ({ password }) => {
    setSecurityError(null);
    setSecurityStatus(null);

    try {
      await changePasswordMutation.mutateAsync(password);
      resetPasswordForm({
        confirmPassword: "",
        password: ""
      });
      setSecurityStatus("Password updated.");
    } catch (error) {
      setSecurityError(getSupabaseErrorMessage(error));
    }
  });

  async function linkOAuthProvider(provider: SupportedOAuthProvider) {
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
  }

  return (
    <Screen>
      <View
        style={{
          alignSelf: "center",
          gap: atomSpacing[5],
          maxWidth: isExpanded ? 1040 : authCardMaxWidth,
          width: "100%"
        }}
      >
        <NavScreenHeader
          description={user?.email ?? session?.user.email}
          title="Profile"
        />

        <View
          style={[
            profileStyles.workspace,
            isExpanded ? profileStyles.workspaceExpanded : null
          ]}
        >
          {isExpanded ? (
            <View style={profileStyles.sectionSidebar}>
              <ProfileSectionNavigation
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <AppButton
                color="danger"
                icon={LogoutIcon}
                iconAfter={false}
                onPress={() => {
                  void logOut();
                }}
                size="sm"
                variant="bordered"
              >
                Log Out
              </AppButton>
            </View>
          ) : (
            <SegmentedTabs
              onChange={setActiveTab}
              options={profileTabs}
              value={activeTab}
            />
          )}

          <View style={profileStyles.sectionContent}>

        {activeTab === "profile" ? (
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[5] }}>
              <View style={{ gap: atomSpacing[1] }}>
                <AppText variant="label">Profile</AppText>
                <AppText tone="muted">Personal details</AppText>
              </View>

              <View style={{ gap: atomSpacing[4] }}>
                <View
                  style={{
                    alignItems: "center",
                    gap: atomSpacing[3]
                  }}
                >
                  <AvatarPicker
                    currentUrl={avatarDisplayUrl ?? ""}
                    isLoading={avatarDisplayLoading}
                    onChange={(asset) => {
                      setAvatarAsset(asset);
                      setFormError(null);
                      setStatusMessage(null);
                    }}
                    value={avatarAsset}
                  />
                  {avatarDisplayError ? (
                    <FieldMessage tone="error">
                      Profile photo unavailable. Try refreshing the page.
                    </FieldMessage>
                  ) : null}
                </View>

                <Controller
                  control={profileControl}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <TextField
                      errorText={fieldState.error?.message}
                      label="First Name"
                      leftIcon={UserIcon}
                      onBlur={field.onBlur}
                      onChangeText={(value) => {
                        field.onChange(value);
                        setFormError(null);
                      }}
                      placeholder="First name"
                      required
                      size="md"
                      value={field.value}
                    />
                  )}
                />

                <Controller
                  control={profileControl}
                  name="lastName"
                  render={({ field }) => (
                    <TextField
                      label="Last Name"
                      leftIcon={UserIcon}
                      onBlur={field.onBlur}
                      onChangeText={(value) => {
                        field.onChange(value);
                        setFormError(null);
                      }}
                      placeholder="Last name"
                      size="md"
                      value={field.value}
                    />
                  )}
                />

                <Controller
                  control={profileControl}
                  name="phoneNumber"
                  render={({ field }) => (
                    <TextField
                      autoComplete="tel"
                      keyboardType="phone-pad"
                      label="Phone"
                      leftIcon={PhoneIcon}
                      onBlur={field.onBlur}
                      onChangeText={(value) => {
                        field.onChange(value);
                        setFormError(null);
                      }}
                      placeholder="Phone number"
                      size="md"
                      textContentType="telephoneNumber"
                      value={field.value}
                    />
                  )}
                />
              </View>

              <View style={{ gap: atomSpacing[3] }}>
                <AppButton
                  isDisabled={isProfileSaveDisabled}
                  loading={isProfileSaving}
                  onPress={() => {
                    void saveProfile();
                  }}
                  size="md"
                >
                  Save Profile
                </AppButton>

                {statusMessage ? (
                  <FieldMessage tone="success">{statusMessage}</FieldMessage>
                ) : null}
                {formError ? (
                  <FieldMessage tone="error">{formError}</FieldMessage>
                ) : null}
              </View>
            </View>
          </AppCard>
        ) : null}

        {activeTab === "security" ? (
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[5] }}>
              <View style={{ gap: atomSpacing[1] }}>
                <AppText variant="label">Account Security</AppText>
                <AppText tone="muted">Password settings</AppText>
              </View>

              <View style={{ gap: atomSpacing[4] }}>
                <View style={{ gap: atomSpacing[3] }}>
                  <Controller
                    control={passwordControl}
                    name="password"
                    render={({ field, fieldState }) => (
                      <TextField
                        autoCapitalize="none"
                        autoComplete="new-password"
                        errorText={fieldState.error?.message}
                        helperText={
                          !fieldState.error
                            ? "Use 8+ chars with uppercase, number, and symbol."
                            : null
                        }
                        label="New Password"
                        leftIcon={LockIcon}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          field.onChange(value);
                          setSecurityError(null);
                          setSecurityStatus(null);
                        }}
                        placeholder="new-password"
                        required
                        rightSlot={
                          <PasswordVisibilityToggle
                            onPress={() => {
                              setPasswordVisible((current) => !current);
                            }}
                            visible={passwordVisible}
                          />
                        }
                        size="md"
                        textContentType="newPassword"
                        type={passwordVisible ? "text" : "password"}
                        value={field.value}
                      />
                    )}
                  />

                  <Controller
                    control={passwordControl}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <TextField
                        autoCapitalize="none"
                        autoComplete="new-password"
                        errorText={fieldState.error?.message}
                        label="Confirm Password"
                        leftIcon={LockIcon}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          field.onChange(value);
                          setSecurityError(null);
                          setSecurityStatus(null);
                        }}
                        placeholder="confirm-password"
                        required
                        rightSlot={
                          <PasswordVisibilityToggle
                            onPress={() => {
                              setConfirmPasswordVisible((current) => !current);
                            }}
                            visible={confirmPasswordVisible}
                          />
                        }
                        size="md"
                        textContentType="newPassword"
                        type={confirmPasswordVisible ? "text" : "password"}
                        value={field.value}
                      />
                    )}
                  />

                  <AppButton
                    isDisabled={!isPasswordChangeValid || isUpdatingPassword}
                    loading={isUpdatingPassword}
                    onPress={() => {
                      void changePassword();
                    }}
                    size="md"
                  >
                    Change Password
                  </AppButton>
                </View>
              </View>

              {securityStatus ? (
                <FieldMessage tone="success">{securityStatus}</FieldMessage>
              ) : null}
              {securityError ? (
                <FieldMessage tone="error">{securityError}</FieldMessage>
              ) : null}
            </View>
          </AppCard>
        ) : null}

        {activeTab === "methods" ? (
          <AppCard padding="lg">
            <View style={{ gap: atomSpacing[5] }}>
              <View style={{ gap: atomSpacing[1] }}>
                <AppText variant="label">Sign-In Methods</AppText>
                <AppText tone="muted">Connected access</AppText>
              </View>

              <View style={{ gap: atomSpacing[3] }}>
                <IdentityMethodRow
                  isLinked={linkedProviders.has("email")}
                  provider="email"
                />
                <IdentityMethodRow
                  isActionDisabled={identityLoading || linkingProvider !== null}
                  isLinked={linkedProviders.has("google")}
                  isLoading={linkingProvider === "google"}
                  onLink={() => {
                    void linkOAuthProvider("google");
                  }}
                  provider="google"
                />
                <IdentityMethodRow
                  isActionDisabled={identityLoading || linkingProvider !== null}
                  isLinked={linkedProviders.has("apple")}
                  isLoading={linkingProvider === "apple"}
                  onLink={() => {
                    void linkOAuthProvider("apple");
                  }}
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
                <FieldMessage tone="error">
                  {displayedIdentityError}
                </FieldMessage>
              ) : null}
            </View>
          </AppCard>
        ) : null}

          </View>
        </View>

        {!isExpanded ? (
          <AppButton
            icon={LogoutIcon}
            iconAfter={false}
            onPress={() => {
              void logOut();
            }}
            size="md"
            color="danger"
            variant="bordered"
          >
            Log Out
          </AppButton>
        ) : null}
      </View>
    </Screen>
  );
}

function ProfileSectionNavigation({
  activeTab,
  onChange
}: {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={{ gap: atomSpacing[2] }}>
      {profileTabs.map((tab) => {
        const selected = tab.value === activeTab;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={({ pressed }) => ({
              backgroundColor: selected
                ? `${atomPalette.accent}14`
                : "transparent",
              borderColor: selected ? `${atomPalette.accent}3D` : "transparent",
              borderRadius: atomRadii.md,
              borderWidth: 1,
              opacity: pressed ? 0.72 : 1,
              paddingHorizontal: atomSpacing[4],
              paddingVertical: atomSpacing[3]
            })}
          >
            <AppText tone={selected ? "accent" : "muted"} variant="label">
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function AvatarPicker({
  currentUrl,
  isLoading,
  onChange,
  value
}: {
  currentUrl: string;
  isLoading: boolean;
  onChange: (asset: ProfileAvatarAsset) => void;
  value: ProfileAvatarAsset | null;
}) {
  const previewUri = value?.uri ?? currentUrl.trim();
  const [pickerError, setPickerError] = useState<string | null>(null);

  const pickImage = async () => {
    setPickerError(null);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPickerError(
          permission.canAskAgain
            ? "Photo access is required to choose a profile picture. Allow access and try again."
            : "Photo access is disabled. Enable it in your device settings, then try again."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      onChange({
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        uri: asset.uri
      });
    } catch (error) {
      setPickerError(
        getUserFacingErrorMessage(
          error,
          "We couldn't open your photo library. Try again."
        )
      );
    }
  };

  return (
    <View style={{ gap: atomSpacing[2] }}>
      <Pressable
        accessibilityLabel="Change profile photo"
        accessibilityRole="button"
        onPress={() => {
          void pickImage();
        }}
        style={StyleSheet.flatten([
          profileStyles.avatarPicker,
          Platform.OS === "web" ? profileStyles.webCursor : null
        ])}
      >
        {value?.uri ? (
          <Image
            contentFit="cover"
            source={{ uri: value.uri }}
            style={profileStyles.avatarImage}
          />
        ) : isLoading ? (
          <ActivityIndicator color={atomPalette.textSubtle} />
        ) : previewUri ? (
          <Image
            contentFit="cover"
            source={{ uri: previewUri }}
            style={profileStyles.avatarImage}
          />
        ) : (
          <CameraIcon color={atomPalette.textSubtle} size="lg" />
        )}
        <View style={profileStyles.avatarPickerBadge}>
          <CameraIcon color={atomPalette.accentText} size="sm" />
        </View>
      </Pressable>
      {pickerError ? (
        <FieldMessage tone="error">{pickerError}</FieldMessage>
      ) : null}
    </View>
  );
}

const profileStyles = StyleSheet.create({
  avatarImage: {
    height: "100%",
    width: "100%"
  },
  avatarPicker: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.border,
    borderRadius: atomRadii.full,
    borderWidth: 1,
    height: 104,
    justifyContent: "center",
    overflow: "hidden",
    width: 104
  },
  avatarPickerBadge: {
    alignItems: "center",
    backgroundColor: atomPalette.accent,
    borderColor: atomPalette.surface,
    borderRadius: atomRadii.full,
    borderWidth: 2,
    bottom: 4,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    width: 32
  },
  sectionContent: {
    flex: 1,
    gap: atomSpacing[5],
    minWidth: 0
  },
  sectionSidebar: {
    gap: atomSpacing[4],
    justifyContent: "space-between",
    width: 224
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle,
  workspace: {
    gap: atomSpacing[5]
  },
  workspaceExpanded: {
    alignItems: "flex-start",
    flexDirection: "row"
  }
});

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
    <View
      style={{
        alignItems: "center",
        borderColor: atomPalette.border,
        borderRadius: atomRadii.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: atomSpacing[3],
        justifyContent: "space-between",
        padding: atomSpacing[4]
      }}
    >
      <View
        style={{
          alignItems: "center",
          flex: 1,
          flexDirection: "row",
          gap: atomSpacing[3]
        }}
      >
        <ProviderIcon provider={provider} />
        <View style={{ flex: 1, gap: atomSpacing[1] }}>
          <AppText>{copy.label}</AppText>
          <AppText tone="muted" variant="bodySm">
            {copy.supporting}
          </AppText>
        </View>
      </View>

      {isLinked ? (
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: atomSpacing[1]
          }}
        >
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
        style={{
          height: 24,
          resizeMode: "contain",
          width: 24
        }}
      />
    );
  }

  return <MailIcon color={atomPalette.textMuted} size="lg" />;
}
