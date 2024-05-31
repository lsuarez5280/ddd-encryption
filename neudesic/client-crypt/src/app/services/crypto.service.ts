import { Inject, Injectable } from '@angular/core';
import { BROWSER_CRYPTO } from './tokens.service';
import { CipherMessage } from './cipher-message';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * A service for managing the lifetime of a symmetric key and encrypting messages using that key.
 */
export interface CryptoKeyManager {
  /**
   * Encrypts a message using the managed key.
   * @param message The message to encrypt.
   * @returns A CipherMessage containing the initialization vector, wrapped key, and cipher text in base64 format.
   * @see CipherMessage
   */
  encrypt(message: any): Promise<CipherMessage>;
}

/**
 * The endpoint for obtaining the public key.
 * @remarks This endpoint should be transformed and exposed by an app config.
 */
const JWK_ENDPOINT: string = 'http://localhost:7071/api/GetKey';

/**
 * Converts a buffer to a base64 string.
 * @param value The buffer to convert.
 * @returns The base64 representation.
 * @remarks This method is used to shim the absence of a BufferConstructor implementation in the browser.
 * @see BufferConstructor
 */
const bufferToString = (value: ArrayBufferLike): string => {
  const arr = new Uint8Array(value);
  const chars = arr.reduce((data, byte) => data + String.fromCharCode(byte), "");
  return btoa(chars);
};

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  constructor(
    @Inject(BROWSER_CRYPTO) private readonly crypto: Crypto,
    private readonly client: HttpClient
  ) { }

  /**
   * The cached public key.
   */
  private _cachedPublicKey?: CryptoKey;

  private _encoder = new TextEncoder();

  /**
   * Obtains the public key from the server.
   */
  private async getPublicKey(): Promise<CryptoKey> {
    if (!this._cachedPublicKey) {
      // Expire the cached public key after 30 minutes
      setTimeout(() => this._cachedPublicKey = undefined, 30 * 60 * 1000);
      const jwk = await firstValueFrom(this.client.get<JsonWebKey>(JWK_ENDPOINT));
      this._cachedPublicKey = await this.crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['wrapKey'])
    }

    return this._cachedPublicKey;
  }

  /**
   * Creates a managed lifetime for a new symmetric key.
   * @returns A new symmetric key.
   */
  public async createSymmetricKey(): Promise<CryptoKeyManager> {
    // Create a closure to capture the service for access to private instance methods
    return (async (that: CryptoService): Promise<CryptoKeyManager> => {
      // Create a new managed symmetric key
      const key = await that.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);

      return {
        // Define a method to encrypt a message using the managed key
        encrypt: async (message: any): Promise<CipherMessage> => {
          // Generate a new initialization vector for the AES-GCM cipher
          const iv = that.crypto.getRandomValues(new Uint8Array(12));
          
          // Encode the message as a UTF-8 byte array
          const messageBytes = that._encoder.encode(JSON.stringify(message));
          
          // Encrypt the message using the managed key
          const cipherText = await that.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, messageBytes);
          
          // Wrap the managed key using the RSA public key
          const wrappedKey = await that.wrapSymmetricKey(key);
          
          // Create the cipher message object
          return {
            iv: bufferToString(iv),
            key: wrappedKey,
            cipherText: bufferToString(cipherText)
          };
        }
      };
    })(this);
  }

  /**
   * Wraps a symmetric key using a public key published by the API.
   * @param symmetricKey The symmetric key to wrap.
   * @returns The wrapped symmetric key.
   * @throws If the key is not an AES-GCM key with encrypt usage.
   */
  private async wrapSymmetricKey(symmetricKey: CryptoKey): Promise<string> {
    if (symmetricKey.algorithm.name !== 'AES-GCM' || !symmetricKey.usages.includes('encrypt')) {
      throw new Error('Invalid key provided. Key must be an AES-GCM key with encrypt usage.');
    }
        // Get the public key from the server
        const publicKey = await this.getPublicKey();

        // Wrap the symmetric key using the RSA public key
        const wrappedKey = await this.crypto.subtle.wrapKey('raw', symmetricKey, publicKey, { name: 'RSA-OAEP' });
    
        // Encode the wrapped key bytes as a base64 string
        return bufferToString(wrappedKey);
  }
}
