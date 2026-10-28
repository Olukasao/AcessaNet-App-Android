import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

// Os tokens da Central ficam no Android Keystore, não em texto puro no WebView.
// clienteApi lê localStorage de forma síncrona; então os tokens vivem num cache
// em memória (hidratado do Keystore antes do React montar) e nunca chegam ao localStorage.
const SECURE_KEYS = ["acessanet.customer.accessToken", "acessanet.customer.refreshToken"];
const memory = new Map();

export async function installSecureTokenStorage() {
  if (!Capacitor.isNativePlatform()) return;

  for (const key of SECURE_KEYS) {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      if (value) memory.set(key, value);
    } catch {
      // chave inexistente
    }
    window.localStorage.removeItem(key);
  }

  const proto = Storage.prototype;
  const rawGet = proto.getItem;
  const rawSet = proto.setItem;
  const rawRemove = proto.removeItem;

  proto.getItem = function (key) {
    return SECURE_KEYS.includes(key) ? (memory.get(key) ?? null) : rawGet.call(this, key);
  };
  proto.setItem = function (key, value) {
    if (!SECURE_KEYS.includes(key)) return rawSet.call(this, key, value);
    memory.set(key, String(value));
    void SecureStoragePlugin.set({ key, value: String(value) }).catch(() => {});
  };
  proto.removeItem = function (key) {
    if (!SECURE_KEYS.includes(key)) return rawRemove.call(this, key);
    memory.delete(key);
    void SecureStoragePlugin.remove({ key }).catch(() => {});
  };
}
