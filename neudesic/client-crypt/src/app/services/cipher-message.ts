/**
 * An interface representing an enciphered message.
 */
export interface CipherMessage {
    /**
     * The initialization vector used to encipher the message in base64 format.
     */
    iv: string;
    /**
     * The wrapped key used to encipher the message in base64 format.
     */
    key: string;
    /**
     * The enciphered message in base64 format.
     */
    cipherText: string;
}
