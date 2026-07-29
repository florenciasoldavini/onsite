import { z } from "zod";

export type RouteParamValue = string | string[] | undefined;

const uuidRouteParamSchema = z.string().trim().uuid();

export function firstRouteParam(value: RouteParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRequiredUuidRouteParam(value: RouteParamValue) {
  const result = uuidRouteParamSchema.safeParse(firstRouteParam(value));
  return result.success ? result.data : null;
}

export function parseOptionalUuidRouteParam(value: RouteParamValue) {
  const result = uuidRouteParamSchema.safeParse(firstRouteParam(value));
  return result.success ? result.data : undefined;
}

export function getUrlFragmentParam(url: string | null, paramName: string) {
  if (!url) return undefined;

  try {
    const fragment = new URL(url).hash.replace(/^#/, "");
    return new URLSearchParams(fragment).get(paramName) ?? undefined;
  } catch {
    return undefined;
  }
}
