{
  "targets": [
    {
      "target_name": "uvc_controller",
      "sources": [
        "uvc_controller.mm",
        "UVCController.m",
        "UVCType.m",
        "UVCValue.m"
      ],
      "include_dirs": [
        "include"
      ],
      "link_settings": {
        "libraries": [
          "-framework IOKit",
          "-framework Foundation",
          "-framework ApplicationServices"
        ]
      },
      "xcode_settings": {
        "OTHER_CFLAGS": [
          "-fno-objc-arc"
        ],
        "OTHER_CPLUSPLUSFLAGS": [
          "-std=c++17",
          "-stdlib=libc++",
          "-fno-objc-arc"
        ],
        "OTHER_LDFLAGS": [
          "-framework IOKit",
          "-framework Foundation",
          "-framework ApplicationServices"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "cflags+": ["-arch x86_64", "-arch arm64", "-fno-objc-arc"],
      "ldflags+": ["-arch x86_64", "-arch arm64"],
      "xcode_settings": {
        "ARCHS": ["x86_64", "arm64"]
      }
    }
  ]
}
