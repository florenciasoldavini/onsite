import { Redirect } from "expo-router";

export default function ClientsRedirectRoute() {
  return (
    <Redirect
      href={
        {
          pathname: "/directory",
          params: { section: "clients" }
        } as never
      }
    />
  );
}
