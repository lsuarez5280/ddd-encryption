using System.Security.Cryptography;
using System.Text;

var encoder = Encoding.ASCII;
var rng = RandomNumberGenerator.Create();

/// <summary>
/// XORs two byte arrays together, returning a new byte array of the same length.
/// </summary>
/// <param name="operand1">The first byte array.</param>
/// <param name="operand2">The second byte array.</param>
/// <returns>A new byte array containing the XOR of the two operands.</returns>
byte[] XorBytes(byte[] operand1, byte[] operand2)
{
    var length = Math.Min(operand1.Length, operand2.Length);
    var result = new byte[length];
    for (var i = 0; i < length; i++)
    {
        result[i] = (byte)(operand1[i] ^ operand2[i]);
    }
    return result;
}

/// <summary>
/// Writes a byte array to the console in two lines.
/// The first line contains the ASCII representation of the bytes.
/// The second line contains the decimal representation of the bytes.
/// </summary>
/// <param name="label">A label to display before the bytes.</param>
/// <param name="bytes">The bytes to display.</param>
/// <remarks>
/// If a byte is less than 32, it is displayed as a question mark.
/// </remarks>
void WriteBytes(string label, byte[] bytes)
{
    Console.WriteLine($"\n\n{label}\n");
    var line1 = " ";
    var line2 = "";
    foreach (var b in bytes)
    {

        line1 += (b < 32 ? '?' : encoder!.GetChars(new[] { b })[0]) + "   ";
        line2 += b.ToString("D3") + " ";
    }
    Console.WriteLine($"{line1}\n{line2}");
}

Console.Write("Enter your message: ");
var message = Console.ReadLine()!;
var messageBytes = encoder.GetBytes(message);

// Create a "Key" of the same length as the message
var len = message.Length;
var key = new byte[len];
rng.GetBytes(key);

// Display message and key bytes
WriteBytes($"Message \"{message}\"", messageBytes);
WriteBytes("Key value", key);

// Create and display cipher bytes
var cipherBytes = XorBytes(messageBytes, key);
WriteBytes("Ciphertext", cipherBytes);

// Create and display plaintext
var plaintextBytes = XorBytes(cipherBytes, key);
var plaintext = encoder.GetString(plaintextBytes);
WriteBytes($"Plaintext \"{plaintext}\"", plaintextBytes);