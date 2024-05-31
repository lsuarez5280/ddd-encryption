import { InjectionToken } from "@angular/core";

export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
    providedIn: 'root',
    factory: () => localStorage
});

export const BROWSER_CRYPTO = new InjectionToken<Crypto>('Browser Crypto', {
    providedIn: 'root',
    factory: () => window.crypto
});