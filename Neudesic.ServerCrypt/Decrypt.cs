using System;
using System.Security.Cryptography;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Azure.Security.KeyVault.Keys;
using Azure.Security.KeyVault.Keys.Cryptography;
using Azure.Identity;
namespace Neudesic.ServerCrypt
{
    public class Decrypt
    {
        [FunctionName("Decrypt")]
        public static async Task Run([BlobTrigger("incoming-data/{name}")] Stream message, string name,
        [Blob("decrypted-data/{rand-guid}.json", FileAccess.Write)] Stream blobOut,
        ILogger log)
        {
            log.LogInformation($"C# Blob trigger function processed: {name}");

            // Deserialize the message
            using var sr = new StreamReader(message);
            var blobItem = await sr.ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(blobItem);
            
            // Deserialize and assign byte arrays
            string iv64 = data.iv;
            byte[] ivBytes = Convert.FromBase64String(iv64);
            
            string wrappedKey64 = data.key;
            byte[] wrappedKeyBytes = Convert.FromBase64String(wrappedKey64);
            
            string cipherText64 = data.cipherText;
            byte[] cipherTextAndTagBytes = Convert.FromBase64String(cipherText64);

            // Build the key client using the vault URI and a DefaultAzureCredential
            var keyClient = new KeyClient(vaultUri: new Uri("https://[yourvault].vault.azure.net/"), credential: new DefaultAzureCredential());
            
            // Retrieve the key that will be used for unwrapping
            KeyVaultKey rsaKey = await keyClient.GetKeyAsync("[yourkey]");
            
            // Build the cryptography client using the retrieved key
            var cryptoClient = new CryptographyClient(rsaKey.Id, new DefaultAzureCredential());
            
            // Unwrap the key
            UnwrapResult unwrapResult = await cryptoClient.UnwrapKeyAsync(KeyWrapAlgorithm.RsaOaep256, wrappedKeyBytes);
            byte[] unwrappedKeyBytes = unwrapResult.Key;

            // Separate the AES-GCM authentication tag from the rest of the cipher text
            // The authentication tag is appended as the last 16 bytes of the cipher text in the SubtleCrypto AES-GCM implementation
            byte[] cipherTextBytes = cipherTextAndTagBytes[..^16];
            byte[] tagBytes = cipherTextAndTagBytes[^16..];
            
            // Create a byte array for the decrypted text
            byte[] plainBytes = new byte[cipherTextBytes.Length];

            // Perform decryption and write the plaintext message
            using var aes = new AesGcm(unwrappedKeyBytes);
            aes.Decrypt(ivBytes, cipherTextBytes, tagBytes, plainBytes);
            
            await blobOut.WriteAsync(plainBytes);
        }
    }
}
