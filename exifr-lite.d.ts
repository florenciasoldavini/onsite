declare module "exifr/dist/lite.esm.mjs" {
  type ExifrInput = ArrayBuffer | Blob | Uint8Array;

  export function gps(
    input: ExifrInput
  ): Promise<
    | { latitude: number; longitude: number }
    | undefined
  >;

  export function orientation(
    input: ExifrInput
  ): Promise<number | undefined>;

  export function parse(
    input: ExifrInput,
    options?: boolean | (string | number)[] | Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined>;
}
