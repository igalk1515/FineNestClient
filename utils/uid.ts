import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export async function getOrCreateUID(): Promise<string> {
  let uid = await SecureStore.getItemAsync('user_uid');

  if (!uid) {
    const timestamp = Date.now().toString();
    uid = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      timestamp
    );
    await SecureStore.setItemAsync('user_uid', uid);
  }

  return uid;
}
