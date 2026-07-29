import SignInScreen from "@/features/auth/screens/sign-in-screen";
import { getSafePostAuthRedirectPath } from "@/features/auth/utils/auth-callback";
import { firstRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function SignInRoute() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextPath = getSafePostAuthRedirectPath(firstRouteParam(params.next));

  return <SignInScreen nextPath={nextPath} />;
}
