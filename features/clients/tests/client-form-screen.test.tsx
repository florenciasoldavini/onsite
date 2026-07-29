import {
  useClient,
  useCreateClient,
  useUpdateClient
} from "@/features/clients/hooks/use-clients";
import ClientFormScreen from "@/features/clients/screens/client-form-screen";
import type { User } from "@/features/auth/types/auth.types";
import type { Client } from "@/features/clients/types/client";
import { useAppToast } from "@/shared/ui/components/toast";
import { renderWithAppProviders } from "@/tests/support/render";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockCreateClient = jest.fn();
const mockUpdateClient = jest.fn();
const mockShowToast = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace
  })
}));

jest.mock("@/features/clients/hooks/use-clients", () => ({
  useClient: jest.fn(),
  useCreateClient: jest.fn(),
  useUpdateClient: jest.fn()
}));

jest.mock("@/shared/ui/components/toast", () => ({
  useAppToast: jest.fn()
}));

const client: Client = {
  created_at: "2026-07-28T10:00:00.000Z",
  deleted_at: null,
  email: "ada@example.com",
  first_name: "Ada",
  id: "client-1",
  last_name: "Lovelace",
  owner_id: "owner-1",
  phone_number: "+54 11 5555 0101",
  updated_at: null
};
const owner = { id: "owner-1", role: "user" } as User;
const projectParticipant = { id: "participant-1", role: "user" } as User;

describe("ClientFormScreen", () => {
  beforeEach(() => {
    jest.mocked(useAppToast).mockReturnValue({ show: mockShowToast });
    jest.mocked(useClient).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    jest.mocked(useCreateClient).mockReturnValue({
      isPending: false,
      mutateAsync: mockCreateClient
    } as never);
    jest.mocked(useUpdateClient).mockReturnValue({
      isPending: false,
      mutateAsync: mockUpdateClient
    } as never);
    mockCreateClient.mockResolvedValue(client);
    mockUpdateClient.mockResolvedValue(client);
  });

  it("keeps create disabled until required input is valid and then saves", async () => {
    await renderWithAppProviders(<ClientFormScreen mode="create" />);

    expect(
      screen.getByRole("button", { name: "Create client" })
    ).toBeDisabled();

    await fireEvent.changeText(screen.getByPlaceholderText("Ada"), "  Ada  ");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create client" })
      ).toBeEnabled();
    });
    await fireEvent.press(
      screen.getByRole("button", { name: "Create client" })
    );

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        email: null,
        first_name: "Ada",
        last_name: null,
        phone_number: null
      });
      expect(mockShowToast).toHaveBeenCalledWith({
        description: "Ada Lovelace was created successfully.",
        title: "Client created",
        tone: "success"
      });
      expect(mockReplace).toHaveBeenCalledWith("/clients/client-1");
    });
  });

  it("shows an actionable error state and retries a failed edit query", async () => {
    jest.mocked(useClient).mockReturnValue({
      data: undefined,
      error: new Error("database details"),
      isError: true,
      isLoading: false,
      refetch: mockRefetch
    } as never);

    await renderWithAppProviders(
      <ClientFormScreen clientId="client-1" mode="edit" />
    );

    expect(screen.getByText("Client unavailable")).toBeOnTheScreen();
    expect(
      screen.getByText("We couldn't load this client. Try again.")
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Retry"));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("routes back to the catalog when an edit target is not found", async () => {
    await renderWithAppProviders(
      <ClientFormScreen clientId="missing-client" mode="edit" />
    );

    expect(screen.getByText("Client not found")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Back to clients"));

    expect(mockReplace).toHaveBeenCalledWith("/directory?section=clients");
  });

  it("shows finite feedback when an edit route has no client id", async () => {
    await renderWithAppProviders(<ClientFormScreen mode="edit" />);

    expect(screen.getByText("Invalid client link")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Save changes" })
    ).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Back to clients"));

    expect(mockReplace).toHaveBeenCalledWith("/directory?section=clients");
  });

  it("requires an edit before saving and submits the changed values", async () => {
    jest.mocked(useClient).mockReturnValue({
      data: client,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);
    const updatedClient = { ...client, first_name: "Augusta" };
    mockUpdateClient.mockResolvedValue(updatedClient);

    await renderWithAppProviders(
      <ClientFormScreen clientId="client-1" mode="edit" />,
      { auth: { user: owner } }
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ada")).toHaveDisplayValue("Ada");
    });
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await fireEvent.changeText(screen.getByPlaceholderText("Ada"), "Augusta");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save changes" })
      ).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledWith({
        email: "ada@example.com",
        first_name: "Augusta",
        last_name: "Lovelace",
        phone_number: "+54 11 5555 0101"
      });
      expect(mockReplace).toHaveBeenCalledWith("/clients/client-1");
    });
  });

  it("blocks direct edit navigation for a user who can read but cannot manage the client", async () => {
    jest.mocked(useClient).mockReturnValue({
      data: client,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch
    } as never);

    await renderWithAppProviders(
      <ClientFormScreen clientId="client-1" mode="edit" />,
      { auth: { user: projectParticipant } }
    );

    expect(screen.getByText("Client editing unavailable")).toBeOnTheScreen();
    expect(
      screen.getByText("You don't have permission to edit this client.")
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Save changes" })
    ).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Back to client"));

    expect(mockReplace).toHaveBeenCalledWith("/clients/client-1");
    expect(mockUpdateClient).not.toHaveBeenCalled();
  });

  it("keeps the form open and presents a safe save error", async () => {
    mockCreateClient.mockRejectedValue(new Error("database details"));
    await renderWithAppProviders(<ClientFormScreen mode="create" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Ada"), "Ada");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create client" })
      ).toBeEnabled();
    });
    await fireEvent.press(
      screen.getByRole("button", { name: "Create client" })
    );

    expect(
      await screen.findByText(
        "We couldn't save this client. Check your connection and try again."
      )
    ).toBeOnTheScreen();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
