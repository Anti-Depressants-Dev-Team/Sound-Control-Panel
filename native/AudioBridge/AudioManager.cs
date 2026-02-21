using NAudio.CoreAudioApi;
using NAudio.CoreAudioApi.Interfaces;
using System.Diagnostics;

namespace AudioBridge;

/// <summary>
/// Core audio logic using NAudio.CoreAudioApi (Windows Core Audio API).
/// Handles device enumeration, peak metering, and default device management.
/// </summary>
public class AudioManager
{
    private readonly MMDeviceEnumerator _enumerator;

    public AudioManager()
    {
        _enumerator = new MMDeviceEnumerator();
    }

    /// <summary>
    /// Enumerate all audio devices (playback + recording), including disabled and unplugged.
    /// </summary>
    public List<DeviceInfo> GetDevices()
    {
        var devices = new List<DeviceInfo>();

        // Get default device IDs for comparison
        string? defaultPlaybackId = GetDefaultDeviceId(DataFlow.Render);
        string? defaultRecordingId = GetDefaultDeviceId(DataFlow.Capture);

        // Enumerate playback devices
        var playbackDevices = _enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active | DeviceState.Disabled | DeviceState.Unplugged);
        foreach (var device in playbackDevices)
        {
            devices.Add(CreateDeviceInfo(device, "playback", defaultPlaybackId));
        }

        // Enumerate recording devices
        var recordingDevices = _enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active | DeviceState.Disabled | DeviceState.Unplugged);
        foreach (var device in recordingDevices)
        {
            devices.Add(CreateDeviceInfo(device, "recording", defaultRecordingId));
        }

        return devices;
    }

    /// <summary>
    /// Get live peak volume levels for all active devices.
    /// </summary>
    public List<PeakLevelInfo> GetPeakLevels()
    {
        var levels = new List<PeakLevelInfo>();

        foreach (DataFlow flow in new[] { DataFlow.Render, DataFlow.Capture })
        {
            var activeDevices = _enumerator.EnumerateAudioEndPoints(flow, DeviceState.Active);
            foreach (var device in activeDevices)
            {
                try
                {
                    float peak = device.AudioMeterInformation.MasterPeakValue;
                    levels.Add(new PeakLevelInfo
                    {
                        Id = device.ID,
                        PeakLevel = peak
                    });
                }
                catch
                {
                    // Device may not support peak metering
                }
            }
        }

        return levels;
    }

    /// <summary>
    /// Set a device as the default audio device for BOTH multimedia and communications.
    /// </summary>
    public object SetDefaultDevice(string deviceId)
    {
        try
        {
            var policyConfig = new PolicyConfigClient();
            policyConfig.SetDefaultEndpoint(deviceId, Role.Multimedia);
            policyConfig.SetDefaultEndpoint(deviceId, Role.Communications);
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Get detailed properties for a specific device by ID.
    /// </summary>
    public object GetDeviceProperties(string deviceId)
    {
        try
        {
            var device = FindDeviceById(deviceId);
            if (device == null)
                return new { success = false, error = "Device not found" };

            int channelCount = 2;
            float masterVolume = 0;
            bool isMuted = false;
            float[] channelVols = new float[] { 0, 0 };
            int sampleRate = 48000;
            int bitDepth = 16;

            if (device.State == DeviceState.Active)
            {
                try
                {
                    var epv = device.AudioEndpointVolume;
                    masterVolume = epv.MasterVolumeLevelScalar;
                    isMuted = epv.Mute;
                    channelCount = epv.Channels.Count;
                    channelVols = new float[channelCount];
                    for (int i = 0; i < channelCount; i++)
                    {
                        channelVols[i] = epv.Channels[i].VolumeLevelScalar;
                    }
                }
                catch { }

                // Try to read format from device property store
                try
                {
                    var props = device.Properties;
                    // PKEY_AudioEngine_DeviceFormat
                    var formatKey = new PropertyKey(Guid.Parse("{f19f064d-082c-4e27-bc73-6882a1bb8e4c}"), 0);
                    if (props.Contains(formatKey))
                    {
                        var blob = props[formatKey].Value;
                        if (blob is byte[] rawBytes && rawBytes.Length >= 16)
                        {
                            // WAVEFORMATEX: channels at offset 2 (ushort), sampleRate at 4 (uint), bitsPerSample at 14 (ushort)
                            channelCount = BitConverter.ToUInt16(rawBytes, 2);
                            sampleRate = (int)BitConverter.ToUInt32(rawBytes, 4);
                            bitDepth = BitConverter.ToUInt16(rawBytes, 14);
                        }
                    }
                }
                catch { }
            }

            // Parse friendly name for description and interface
            string friendlyName = device.FriendlyName;
            string description = friendlyName;
            string interfaceName = "Unknown";

            var match = System.Text.RegularExpressions.Regex.Match(friendlyName, @"^(.+?)\s*\((.+)\)$");
            if (match.Success)
            {
                description = match.Groups[1].Value.Trim();
                interfaceName = match.Groups[2].Value.Trim();
            }

            // Try to get device description from properties
            string driverName = interfaceName;
            try
            {
                var props = device.Properties;
                var descKey = new PropertyKey(Guid.Parse("{a45c254e-df1c-4efd-8020-67d146a850e0}"), 2);
                if (props.Contains(descKey))
                {
                    var val = props[descKey].Value;
                    if (val != null) description = val.ToString()!;
                }
            }
            catch { }

            return new DevicePropertiesInfo
            {
                Id = device.ID,
                Name = friendlyName,
                Description = description,
                InterfaceName = interfaceName,
                DriverName = driverName,
                DeviceState = device.State.ToString(),
                ChannelCount = channelCount,
                SampleRate = sampleRate,
                BitDepth = bitDepth,
                Volume = masterVolume,
                IsMuted = isMuted,
                ChannelVolumes = channelVols.ToList(),
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Set the master volume of a device.
    /// </summary>
    public object SetDeviceVolume(string deviceId, float volume)
    {
        try
        {
            var device = FindDeviceById(deviceId);
            if (device == null)
                return new { success = false, error = "Device not found" };

            device.AudioEndpointVolume.MasterVolumeLevelScalar = Math.Clamp(volume, 0f, 1f);
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Set the mute state of a device.
    /// </summary>
    public object SetDeviceMute(string deviceId, bool muted)
    {
        try
        {
            var device = FindDeviceById(deviceId);
            if (device == null)
                return new { success = false, error = "Device not found" };

            device.AudioEndpointVolume.Mute = muted;
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Set the volume of a specific channel.
    /// </summary>
    public object SetChannelVolume(string deviceId, int channel, float volume)
    {
        try
        {
            var device = FindDeviceById(deviceId);
            if (device == null)
                return new { success = false, error = "Device not found" };

            var epv = device.AudioEndpointVolume;
            if (channel < 0 || channel >= epv.Channels.Count)
                return new { success = false, error = "Invalid channel index" };

            epv.Channels[channel].VolumeLevelScalar = Math.Clamp(volume, 0f, 1f);
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Open the properties panel for a device (opens Windows Sound settings).
    /// </summary>
    public object OpenProperties(string deviceId)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "ms-settings:sound",
                UseShellExecute = true
            });
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Enumerate all audio sessions on the default render device.
    /// Returns per-application volume info (like the Windows Volume Mixer).
    /// </summary>
    public List<AudioSessionInfo> GetAudioSessions()
    {
        var sessions = new List<AudioSessionInfo>();

        try
        {
            var device = _enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
            var sessionManager = device.AudioSessionManager;
            var sessionEnumerator = sessionManager.Sessions;

            for (int i = 0; i < sessionEnumerator.Count; i++)
            {
                try
                {
                    var session = sessionEnumerator[i];
                    if (session.State == AudioSessionState.AudioSessionStateExpired)
                        continue;

                    string sessionId = session.GetSessionIdentifier ?? $"session_{i}";
                    string displayName = session.DisplayName ?? "";
                    string processName = "";
                    string iconPath = session.IconPath ?? "";
                    int processId = (int)session.GetProcessID;

                    try
                    {
                        if (processId > 0)
                        {
                            var process = Process.GetProcessById(processId);
                            processName = process.ProcessName;
                            if (string.IsNullOrEmpty(displayName))
                                displayName = process.MainWindowTitle;
                            if (string.IsNullOrEmpty(displayName))
                                displayName = process.ProcessName;
                            // Try to get the exe path for icon
                            if (string.IsNullOrEmpty(iconPath))
                            {
                                try { iconPath = process.MainModule?.FileName ?? ""; }
                                catch { }
                            }
                        }
                        else
                        {
                            displayName = string.IsNullOrEmpty(displayName) ? "System Sounds" : displayName;
                            processName = "System";
                        }
                    }
                    catch
                    {
                        if (string.IsNullOrEmpty(displayName))
                            displayName = $"Unknown (PID {processId})";
                    }

                    float volume = session.SimpleAudioVolume.Volume;
                    bool isMuted = session.SimpleAudioVolume.Mute;
                    float peakLevel = 0;
                    try { peakLevel = session.AudioMeterInformation.MasterPeakValue; }
                    catch { }

                    sessions.Add(new AudioSessionInfo
                    {
                        Id = sessionId,
                        DisplayName = displayName,
                        ProcessName = processName,
                        IconPath = iconPath,
                        Volume = volume,
                        IsMuted = isMuted,
                        PeakLevel = peakLevel,
                        IsSystemSounds = processId == 0
                    });
                }
                catch { /* skip problematic sessions */ }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"GetAudioSessions error: {ex.Message}");
        }

        return sessions;
    }

    /// <summary>
    /// Set the volume of a specific audio session by session identifier.
    /// </summary>
    public object SetSessionVolume(string sessionId, float volume)
    {
        try
        {
            var session = FindSessionById(sessionId);
            if (session == null)
                return new { success = false, error = "Session not found" };

            session.SimpleAudioVolume.Volume = Math.Clamp(volume, 0f, 1f);
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Set the mute state of a specific audio session by session identifier.
    /// </summary>
    public object SetSessionMute(string sessionId, bool muted)
    {
        try
        {
            var session = FindSessionById(sessionId);
            if (session == null)
                return new { success = false, error = "Session not found" };

            session.SimpleAudioVolume.Mute = muted;
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    // ── Private Helpers ────────────────────────────────────────────────

    private AudioSessionControl? FindSessionById(string sessionId)
    {
        try
        {
            var device = _enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
            var sessionManager = device.AudioSessionManager;
            var sessionEnumerator = sessionManager.Sessions;

            for (int i = 0; i < sessionEnumerator.Count; i++)
            {
                var session = sessionEnumerator[i];
                if (session.GetSessionIdentifier == sessionId)
                    return session;
            }
        }
        catch { }
        return null;
    }

    private MMDevice? FindDeviceById(string deviceId)
    {
        try
        {
            return _enumerator.GetDevice(deviceId);
        }
        catch
        {
            return null;
        }
    }

    private string? GetDefaultDeviceId(DataFlow flow)
    {
        try
        {
            var device = _enumerator.GetDefaultAudioEndpoint(flow, Role.Multimedia);
            return device?.ID;
        }
        catch
        {
            return null;
        }
    }

    private DeviceInfo CreateDeviceInfo(MMDevice device, string type, string? defaultId)
    {
        float volume = 0;
        try
        {
            if (device.State == DeviceState.Active)
            {
                volume = device.AudioEndpointVolume.MasterVolumeLevelScalar;
            }
        }
        catch { }

        string status = device.State switch
        {
            DeviceState.Active => "active",
            DeviceState.Disabled => "disabled",
            DeviceState.Unplugged => "notplugged",
            DeviceState.NotPresent => "notplugged",
            _ => "disabled"
        };

        return new DeviceInfo
        {
            Id = device.ID,
            Name = device.FriendlyName,
            Type = type,
            Status = status,
            IsDefault = device.ID == defaultId,
            Volume = volume,
            PeakLevel = 0
        };
    }
}

// ── Data Transfer Objects ──────────────────────────────────────────────

public class DeviceInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Status { get; set; } = "";
    public bool IsDefault { get; set; }
    public string IconPath { get; set; } = "";
    public float Volume { get; set; }
    public float PeakLevel { get; set; }
}

public class PeakLevelInfo
{
    public string Id { get; set; } = "";
    public float PeakLevel { get; set; }
}

public class DevicePropertiesInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string InterfaceName { get; set; } = "";
    public string DriverName { get; set; } = "";
    public string DeviceState { get; set; } = "";
    public int ChannelCount { get; set; }
    public int SampleRate { get; set; }
    public int BitDepth { get; set; }
    public float Volume { get; set; }
    public bool IsMuted { get; set; }
    public List<float> ChannelVolumes { get; set; } = new();
}

public class AudioSessionInfo
{
    public string Id { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string ProcessName { get; set; } = "";
    public string IconPath { get; set; } = "";
    public float Volume { get; set; }
    public bool IsMuted { get; set; }
    public float PeakLevel { get; set; }
    public bool IsSystemSounds { get; set; }
}
