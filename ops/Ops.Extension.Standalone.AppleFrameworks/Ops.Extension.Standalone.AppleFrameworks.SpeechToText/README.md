# Ops.Extension.Standalone.AppleFrameworks.SpeechToText

This operator implements native, on-device Speech to Text on macOS using Apple's Speech Recognition framework (N-API).

## Info.plist Permissions Requirement

To use this operator in an exported Cables Standalone Electron application, you must add the **Speech Recognition** and **Microphone** usage descriptions to your Electron app's `Info.plist` file.

If these keys are missing, macOS will immediately terminate (crash) the application when it attempts to initialize speech recognition.

### XML Addition for Info.plist

Insert the following lines inside the `<dict>` block of your Electron application's `Info.plist` (typically located in `/Applications/YourApp.app/Contents/Info.plist` or in your build packaging config):

```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>This application requires speech recognition authorization to transcribe speech to text.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This application requires microphone access to capture audio for speech transcription.</string>
```

### Inserting via Terminal (Quick fix for compiled app)

You can insert the speech recognition usage key directly into an already compiled `.app` bundle using `plutil`:

```bash
sudo plutil -insert NSSpeechRecognitionUsageDescription -string "This application requires speech recognition authorization to transcribe speech to text." /Applications/CablesStudio.app/Contents/Info.plist
sudo plutil -insert NSMicrophoneUsageDescription -string "This application requires microphone access to capture audio for speech transcription." /Applications/CablesStudio.app/Contents/Info.plist
```
