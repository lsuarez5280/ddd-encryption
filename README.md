# ddd-encryption
A repository demonstrating a simple one-time pad encryption console app, as well as using Azure Key Vault and the Web Crypto API to securely store and transmit sensitive data in a progressive web app.

## Projects
You can find the demonstrated applications from my Denver Dev Day Spring '24 presentation in these folders.

- [Neudesic.BasiCrypt](./Neudesic.BasiCrypt/): A sample C# console app demonstrating a one-time pad using XOR to encrypt data and decrypt it back.

- [@neudesic/client-crypt](./neudesic/client-crypt/): An Angular PWA that consumes a published public key to encrypt its local storage data and publishes it to a server for decryption.

- [Neudesic.ServerCrypt](./Neudesic.ServerCrypt/): A sample server application that publishes a Key Vault key as a JWK document and decrypts incoming payloads using the vault's private key.