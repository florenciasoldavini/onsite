import type { Client, ClientFormValues } from "@/features/clients/types/client";

export function getClientFormValues(client: Client): ClientFormValues {
  return {
    email: client.email ?? "",
    first_name: client.first_name,
    last_name: client.last_name ?? "",
    phone_number: client.phone_number ?? ""
  };
}
