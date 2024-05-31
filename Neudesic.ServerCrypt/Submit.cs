using System;
using System.IO;
using System.Threading.Tasks;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Neudesic.ServerCrypt
{
    public static class Submit
    {
        [FunctionName("Submit")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req,
            [Blob("incoming-data/{rand-guid}.json", FileAccess.Write)] Stream blobOut,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();

            await blobOut.WriteAsync(Encoding.UTF8.GetBytes(requestBody));

            return new OkObjectResult("File written successfully");
        }
    }
}
