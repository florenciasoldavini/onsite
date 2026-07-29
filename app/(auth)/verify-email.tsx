import VerifyEmailScreen from "@/features/auth/screens/verify-email-screen";
import { getSafePostAuthRedirectPath } from "@/features/auth/utils/auth-callback";
import { firstRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function VerifyEmailRoute() {
  const params = useLocalSearchParams<{
    email?: string | string[];
    next?: string | string[];
    notice?: string | string[];
  }>();

  return (
    <VerifyEmailScreen
      email={firstRouteParam(params.email)}
      nextPath={getSafePostAuthRedirectPath(firstRouteParam(params.next))}
      notice={firstRouteParam(params.notice)}
    />
  );
}
