using System.Text.Json;
using System.Text.Json.Serialization;

namespace AudioBridge;

/// <summary>
/// Main entry point — reads JSON commands from stdin, dispatches to AudioManager,
/// and writes JSON responses to stdout. Newline-delimited JSON protocol.
/// </summary>
class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };

    static async Task Main(string[] args)
    {
        var audioManager = new AudioManager();
        using var reader = new StreamReader(Console.OpenStandardInput());

        // Signal ready
        WriteResponse(new BridgeResponse { Id = 0, Data = JsonSerializer.SerializeToElement(new { ready = true }, JsonOptions) });

        while (true)
        {
            string? line = await reader.ReadLineAsync();
            if (line == null) break; // stdin closed

            string trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;

            try
            {
                var request = JsonSerializer.Deserialize<BridgeRequest>(trimmed, JsonOptions);
                if (request == null) continue;

                object? result = request.Command switch
                {
                    "getDevices" => audioManager.GetDevices(),
                    "getPeakLevels" => audioManager.GetPeakLevels(),
                    "setDefaultDevice" => audioManager.SetDefaultDevice(
                        request.Params?.GetProperty("deviceId").GetString() ?? ""),
                    "getDeviceProperties" => audioManager.GetDeviceProperties(
                        request.Params?.GetProperty("deviceId").GetString() ?? ""),
                    "setDeviceVolume" => audioManager.SetDeviceVolume(
                        request.Params?.GetProperty("deviceId").GetString() ?? "",
                        request.Params?.GetProperty("volume").GetSingle() ?? 0f),
                    "setDeviceMute" => audioManager.SetDeviceMute(
                        request.Params?.GetProperty("deviceId").GetString() ?? "",
                        request.Params?.GetProperty("muted").GetBoolean() ?? false),
                    "setChannelVolume" => audioManager.SetChannelVolume(
                        request.Params?.GetProperty("deviceId").GetString() ?? "",
                        request.Params?.GetProperty("channel").GetInt32() ?? 0,
                        request.Params?.GetProperty("volume").GetSingle() ?? 0f),
                    "openProperties" => audioManager.OpenProperties(
                        request.Params?.GetProperty("deviceId").GetString() ?? ""),
                    "getAudioSessions" => audioManager.GetAudioSessions(),
                    "setSessionVolume" => audioManager.SetSessionVolume(
                        request.Params?.GetProperty("sessionId").GetString() ?? "",
                        request.Params?.GetProperty("volume").GetSingle() ?? 0f),
                    "setSessionMute" => audioManager.SetSessionMute(
                        request.Params?.GetProperty("sessionId").GetString() ?? "",
                        request.Params?.GetProperty("muted").GetBoolean() ?? false),
                    _ => throw new InvalidOperationException($"Unknown command: {request.Command}")
                };

                WriteResponse(new BridgeResponse
                {
                    Id = request.Id,
                    Data = JsonSerializer.SerializeToElement(result, JsonOptions)
                });
            }
            catch (Exception ex)
            {
                WriteResponse(new BridgeResponse
                {
                    Id = 0,
                    Error = ex.Message
                });
            }
        }
    }

    static void WriteResponse(BridgeResponse response)
    {
        string json = JsonSerializer.Serialize(response, JsonOptions);
        Console.Out.WriteLine(json);
        Console.Out.Flush();
    }
}

public class BridgeRequest
{
    public int Id { get; set; }
    public string Command { get; set; } = "";
    public JsonElement? Params { get; set; }
}

public class BridgeResponse
{
    public int Id { get; set; }
    public JsonElement? Data { get; set; }
    public string? Error { get; set; }
}
