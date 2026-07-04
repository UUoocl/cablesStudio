{
  "targets": [
    {
      "target_name": "screen_capture_audio",
      "sources": [ "screen_capture_audio.mm" ],
      "link_settings": {
        "libraries": [
          "-framework Foundation",
          "-framework ScreenCaptureKit",
          "-framework CoreMedia",
          "-framework CoreAudio",
          "-framework AudioToolbox"
        ]
      },
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": [
          "-std=c++17",
          "-stdlib=libc++",
          "-fobjc-arc"
        ],
        "OTHER_LDFLAGS": [
          "-framework Foundation",
          "-framework ScreenCaptureKit",
          "-framework CoreMedia",
          "-framework CoreAudio",
          "-framework AudioToolbox"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "12.3"
      },
      "cflags+": ["-arch x86_64", "-arch arm64"],
      "ldflags+": ["-arch x86_64", "-arch arm64"],
      "xcode_settings": {
        "ARCHS": ["x86_64", "arm64"]
      }
    }
  ]
}
