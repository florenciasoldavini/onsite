import { LocalizationContext } from "@/features/localization/providers/localization-context";
import { useContext } from "react";

export function useLocalization() {
  return useContext(LocalizationContext);
}
