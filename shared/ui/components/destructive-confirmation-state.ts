export interface DestructiveConfirmationState {
  error: string | null;
  isOpen: boolean;
}

export type DestructiveConfirmationAction =
  | { type: "clear-error" }
  | { type: "close" }
  | { type: "open" }
  | { error: string; type: "set-error" };

export const initialDestructiveConfirmationState: DestructiveConfirmationState =
  {
    error: null,
    isOpen: false
  };

export function destructiveConfirmationReducer(
  state: DestructiveConfirmationState,
  action: DestructiveConfirmationAction
): DestructiveConfirmationState {
  switch (action.type) {
    case "clear-error":
      return { ...state, error: null };
    case "close":
      return { ...state, isOpen: false };
    case "open":
      return { error: null, isOpen: true };
    case "set-error":
      return { ...state, error: action.error };
  }
}

export function canDismissDestructiveConfirmation(isPending: boolean) {
  return !isPending;
}
