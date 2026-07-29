import * as Crypto from "expo-crypto";

export function createPhotoId() {
  return Crypto.randomUUID();
}
