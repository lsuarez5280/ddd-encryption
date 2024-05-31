import { Injectable, Inject } from '@angular/core';
import { BROWSER_STORAGE } from './tokens.service';
import { CryptoService } from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(
    @Inject(BROWSER_STORAGE) private readonly storage: Storage,
    private readonly crypto: CryptoService
  ) {
  }

  private readonly NEXT_ID_KEY: string = 'nextStoreId';

  /**
   * Saves a message to the store.
   * @param message The message to save to the store.
   * @returns The identifier of the message that was saved to the store.
   */
  public async saveMessage(message: any): Promise<string> {
    const id = this.generateId();
    
    const key = await this.crypto.createSymmetricKey();
    const cipherMessage = await key.encrypt(message);

    this.storage.setItem(id, JSON.stringify(cipherMessage));
    return id;
  }

  /**
   * Generates an identifier for a message.
   * @returns An identifier for a message.
   */
  private generateId(): string {
    const currentId = this.storage.getItem(this.NEXT_ID_KEY);
    const nextId = currentId ? (parseInt(currentId) + 1).toString() : '1';
    this.storage.setItem(this.NEXT_ID_KEY, nextId);
    return `message-${(currentId || '0').padStart(4, '0')}`;
  }

  /**
   * Gets all messages in the store.
   * @returns All messages in the store.
   */
  public getMessages(): { [id: string]: any } {
    return Object.keys(this.storage).filter(key => key.startsWith('message-')).reduce((messages, key) => {
      messages[key] = JSON.parse(this.storage.getItem(key)!);
      return messages;
    }, <{ [id: string]: string }>{});
  }

  /**
   * Clears all messages from the store.
   */
  public clearMessages(): void {
    Object.keys(this.storage).filter(key => key.startsWith('message-')).forEach(key => this.storage.removeItem(key));
  }
}
