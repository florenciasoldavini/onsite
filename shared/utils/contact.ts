import type {
  PersonContactFormValues,
  PersonContactInput,
  PersonName
} from "@/shared/types/contact";

export function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeEmailInput(value: string) {
  return normalizeNullableText(value)?.toLowerCase() ?? null;
}

export function toPersonContactInput(
  values: PersonContactFormValues
): PersonContactInput {
  return {
    email: normalizeEmailInput(values.email),
    first_name: values.first_name.trim(),
    last_name: normalizeNullableText(values.last_name),
    phone_number: normalizeNullableText(values.phone_number)
  };
}

export function getPersonDisplayName(person: PersonName) {
  return [person.first_name, person.last_name].filter(Boolean).join(" ");
}

export function getPersonInitials(person: PersonName) {
  const firstNameCharacters = Array.from(person.first_name.trim());
  const lastNameCharacters = Array.from(person.last_name?.trim() ?? "");
  const initials =
    lastNameCharacters.length > 0
      ? `${firstNameCharacters[0] ?? ""}${lastNameCharacters[0]}`
      : firstNameCharacters.slice(0, 2).join("");

  return initials.toLocaleUpperCase();
}
