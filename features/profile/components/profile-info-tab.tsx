import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfileAvatarUrl } from "@/features/profile/hooks/use-profile-avatar";
import type { ProfileAvatarAsset } from "@/features/profile/repositories/profile-avatar.repository";
import {
  profileInfoSchema,
  type ProfileInfoInput
} from "@/features/profile/schemas/profile.schemas";
import { getSupabaseErrorMessage } from "@/infrastructure/supabase/client";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { FieldMessage } from "@/shared/ui/components/field-message";
import { TextField } from "@/shared/ui/components/input";
import { AppText } from "@/shared/ui/components/text";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { CameraIcon, PhoneIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle
} from "react-native";

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

export function ProfileInfoTab() {
  const { session, updateUserProfile, user } = useAuth();
  const [avatarAsset, setAvatarAsset] = useState<ProfileAvatarAsset | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<ProfileInfoInput>({
    defaultValues: getProfileInfoDefaults(user),
    mode: "onChange",
    resolver: zodResolver(profileInfoSchema)
  });
  const {
    control,
    formState: { isDirty, isValid },
    handleSubmit,
    reset,
    watch
  } = form;
  const avatar = watch("avatar");
  const {
    data: avatarDisplayUrl = null,
    error: avatarDisplayError,
    isLoading: avatarDisplayLoading
  } = useProfileAvatarUrl(avatar);
  const isSaveDisabled =
    isSaving || !isValid || (!isDirty && !avatarAsset);

  useEffect(() => {
    setAvatarAsset(null);
    reset(getProfileInfoDefaults(user));
    setFormError(null);
    setStatusMessage(null);
  }, [
    session?.user.email,
    user?.avatar,
    user?.email,
    user?.first_name,
    user?.last_name,
    user?.phone_number,
    reset
  ]);

  const clearMessages = () => {
    setFormError(null);
    setStatusMessage(null);
  };

  const saveProfile = handleSubmit(async (values) => {
    if (!user) {
      setFormError("You must be signed in to update your profile.");
      return;
    }

    setIsSaving(true);
    clearMessages();

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
        reset(getProfileInfoDefaults(updatedUser));
        setStatusMessage("Profile updated");
      }
    } catch (error) {
      setFormError(getSupabaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <AppCard padding="lg">
      <View style={styles.content}>
        <View style={styles.heading}>
          <AppText variant="label">Profile</AppText>
          <AppText tone="muted">Personal details</AppText>
        </View>

        <View style={styles.fields}>
          <View style={styles.avatarArea}>
            <AvatarPicker
              currentUrl={avatarDisplayUrl ?? ""}
              isLoading={avatarDisplayLoading}
              onChange={(asset) => {
                setAvatarAsset(asset);
                clearMessages();
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
            control={control}
            name="firstName"
            render={({ field, fieldState }) => (
              <TextField
                errorText={fieldState.error?.message}
                label="First Name"
                leftIcon={UserIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  clearMessages();
                }}
                placeholder="First name"
                required
                size="md"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <TextField
                label="Last Name"
                leftIcon={UserIcon}
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  clearMessages();
                }}
                placeholder="Last name"
                size="md"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
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
                  clearMessages();
                }}
                placeholder="Phone number"
                size="md"
                textContentType="telephoneNumber"
                value={field.value}
              />
            )}
          />
        </View>

        <View style={styles.messages}>
          <AppButton
            isDisabled={isSaveDisabled}
            loading={isSaving}
            onPress={() => void saveProfile()}
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
    <View style={styles.avatarPickerRoot}>
      <Pressable
        accessibilityLabel="Change profile photo"
        accessibilityRole="button"
        onPress={() => void pickImage()}
        style={StyleSheet.flatten([
          styles.avatarPicker,
          Platform.OS === "web" ? styles.webCursor : null
        ])}
      >
        {value?.uri ? (
          <Image
            contentFit="cover"
            source={{ uri: value.uri }}
            style={styles.avatarImage}
          />
        ) : isLoading ? (
          <ActivityIndicator color={atomPalette.textSubtle} />
        ) : previewUri ? (
          <Image
            contentFit="cover"
            source={{ uri: previewUri }}
            style={styles.avatarImage}
          />
        ) : (
          <CameraIcon color={atomPalette.textSubtle} size="lg" />
        )}
        <View style={styles.avatarPickerBadge}>
          <CameraIcon color={atomPalette.accentText} size="sm" />
        </View>
      </Pressable>
      {pickerError ? (
        <FieldMessage tone="error">{pickerError}</FieldMessage>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarArea: {
    alignItems: "center",
    gap: atomSpacing[3]
  },
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
  avatarPickerRoot: {
    gap: atomSpacing[2]
  },
  content: {
    gap: atomSpacing[5]
  },
  fields: {
    gap: atomSpacing[4]
  },
  heading: {
    gap: atomSpacing[1]
  },
  messages: {
    gap: atomSpacing[3]
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle
});
