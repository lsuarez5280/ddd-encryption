using Azure.Identity;
using Azure.Security.KeyVault.Keys;
using System;
using System.Runtime.Caching;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Neudesic.ServerCrypt
{
    public static class GetKey
    {
        private const string CACHE_KEY = "PUBLIC_JWT";

        private static readonly ObjectCache tokenCache = MemoryCache.Default;

        [FunctionName("GetKey")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            CacheItem keyContents = tokenCache.GetCacheItem(CACHE_KEY);

            if (keyContents == null)
            {
                var key = await GetKeyFromKeyVault(log);
                if (key == null)
                {
                    return new NotFoundResult();
                }
                keyContents = new CacheItem(CACHE_KEY, key);
                tokenCache.Add(keyContents, new CacheItemPolicy { AbsoluteExpiration = DateTimeOffset.Now.AddHours(1) });
            }

            return new OkObjectResult(JsonSerializer.Serialize(keyContents.Value));
        }

        private static async Task<JsonWebKey> GetKeyFromKeyVault(ILogger log)
        {
            string keyVaultUrl = $"https://[yourvault].vault.azure.net/";
            string keyName = "[yourkey]";

            // Authenticate with Azure Key Vault using a managed identity or a client secret
            var client = new KeyClient(new Uri(keyVaultUrl), new DefaultAzureCredential());

            try
            {
                // Retrieve the key from Azure Key Vault
                KeyVaultKey key = await client.GetKeyAsync(keyName);

                // Return the key in JSON Web Key format
                return key.Key;
            }
            catch (Exception ex)
            {
                log.LogError(ex, "Error retrieving key from Azure Key Vault");
                return null;
            }
        }
    }
}
