using System.Runtime.InteropServices;
using NAudio.CoreAudioApi;

namespace AudioBridge;

/// <summary>
/// COM interop wrapper for the undocumented IPolicyConfig interface.
/// This allows programmatic changing of the default audio device on Windows.
/// </summary>
public class PolicyConfigClient
{
    private readonly IPolicyConfig _policyConfig;

    public PolicyConfigClient()
    {
        _policyConfig = (IPolicyConfig)new PolicyConfigClass();
    }

    public void SetDefaultEndpoint(string deviceId, Role role)
    {
        int hr = _policyConfig.SetDefaultEndpoint(deviceId, role);
        Marshal.ThrowExceptionForHR(hr);
    }
}

[ComImport]
[Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9")]
internal class PolicyConfigClass
{
}

[ComImport]
[Guid("F8679F50-850A-41CF-9C72-430F290290C8")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPolicyConfig
{
    [PreserveSig]
    int GetMixFormat(string pszDeviceName, IntPtr ppFormat);

    [PreserveSig]
    int GetDeviceFormat(string pszDeviceName, bool bDefault, IntPtr ppFormat);

    [PreserveSig]
    int ResetDeviceFormat(string pszDeviceName);

    [PreserveSig]
    int SetDeviceFormat(string pszDeviceName, IntPtr pEndpointFormat, IntPtr mixFormat);

    [PreserveSig]
    int GetProcessingPeriod(string pszDeviceName, bool bDefault, IntPtr pmftDefaultPeriod, IntPtr pmftMinimumPeriod);

    [PreserveSig]
    int SetProcessingPeriod(string pszDeviceName, IntPtr pmftPeriod);

    [PreserveSig]
    int GetShareMode(string pszDeviceName, IntPtr pMode);

    [PreserveSig]
    int SetShareMode(string pszDeviceName, IntPtr mode);

    [PreserveSig]
    int GetPropertyValue(string pszDeviceName, bool bFxStore, IntPtr key, IntPtr pv);

    [PreserveSig]
    int SetPropertyValue(string pszDeviceName, bool bFxStore, IntPtr key, IntPtr pv);

    [PreserveSig]
    int SetDefaultEndpoint(string pszDeviceName, Role role);

    [PreserveSig]
    int SetEndpointVisibility(string pszDeviceName, bool bVisible);
}
