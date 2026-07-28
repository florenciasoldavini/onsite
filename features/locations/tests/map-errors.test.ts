import { getMapsFunctionErrorMessage } from "@/features/locations/maps/map-errors";
import { describe, expect, it } from "vitest";

describe("map errors", () => {
  it("does not expose Edge Function error payload messages", () => {
    const error = new Error(
      "Edge Function returned a non-2xx status code"
    ) as Error & { context: Response };
    error.context = new Response(
      JSON.stringify({ error: "private provider configuration detail" }),
      { status: 500 }
    );

    expect(
      getMapsFunctionErrorMessage(
        error,
        "Map preview is unavailable right now."
      )
    ).toBe("Map preview is unavailable right now.");
  });

  it("maps rate limits from the stable HTTP status", () => {
    const error = new Error("Function failed") as Error & {
      context: Response;
    };
    error.context = new Response(null, { status: 429 });

    expect(getMapsFunctionErrorMessage(error, "Fallback")).toBe(
      "Too many map requests were made. Wait a moment and try again."
    );
  });
});
