# macOS Speech Recognition Permission Setup

If the Swift speech-to-text sidecar exits with `SIGABRT` or outputs a message that speech recognition authorization is not determined/denied, you need to configure the parent Cables application bundle permissions.

On macOS (especially 25.5+), the responsible parent app bundle (`cables.app`) must explicitly declare the speech recognition usage key, or the system will crash the sidecar process.

## Steps to Fix

Run the following commands in your terminal:

```bash
# 1. Add the required speech recognition usage key to the Cables app Info.plist
sudo plutil -insert NSSpeechRecognitionUsageDescription -string "This app requires speech recognition authorization to transcribe speech to text." /Applications/cables_0.10.7.app/Contents/Info.plist

# 2. Re-sign the Cables application bundle so macOS accepts the modified Info.plist
sudo codesign --force --deep --sign - /Applications/cables_0.10.7.app
```

## Note for Updates
If you download a new version of Cables, or re-install the application, the `Info.plist` will be overwritten, and you will need to re-run these commands to authorize the new app bundle.
