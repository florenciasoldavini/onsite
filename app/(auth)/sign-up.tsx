import SignUpScreen from "@/features/auth/screens/sign-up-screen";
import { getSafePostAuthRedirectPath } from "@/features/auth/utils/auth-callback";
import { firstRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function SignUpRoute() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextPath = getSafePostAuthRedirectPath(firstRouteParam(params.next));

  return <SignUpScreen nextPath={nextPath} />;
}
