{
  "targets": [
    {
      "target_name": "stream_deck",
      "sources": [ "stream_deck.mm" ],
      "link_settings": {
        "libraries": [
          "-framework Foundation",
          "-framework IOKit",
          "-framework CoreGraphics",
          "-framework ImageIO"
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
          "-framework IOKit",
          "-framework CoreGraphics",
          "-framework ImageIO"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "cflags+": ["-arch x86_64", "-arch arm64"],
      "ldflags+": ["-arch x86_64", "-arch arm64"],
      "xcode_settings": {
        "ARCHS": ["x86_64", "arm64"]
      }
    }
  ]
}
