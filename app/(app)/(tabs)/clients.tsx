import { Redirect } from "expo-router";

export default function ClientsRedirect() {
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
