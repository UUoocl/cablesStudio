{
  "targets": [
    {
      "target_name": "coreaudio_tap",
      "sources": [ "coreaudio_tap.mm" ],
      "link_settings": {
        "libraries": [
          "-framework Foundation",
          "-framework CoreAudio",
          "-framework AudioToolbox",
          "-framework CoreGraphics"
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
          "-framework CoreAudio",
          "-framework AudioToolbox",
          "-framework CoreGraphics"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "14.2"
      },
      "cflags+": ["-arch x86_64", "-arch arm64"],
      "ldflags+": ["-arch x86_64", "-arch arm64"],
      "xcode_settings": {
        "ARCHS": ["x86_64", "arm64"]
      }
    }
  ]
}
