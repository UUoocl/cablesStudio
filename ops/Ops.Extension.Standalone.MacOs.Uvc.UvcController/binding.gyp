{
  "targets": [
    {
      "target_name": "uvc_controller",
      "sources": [
        "uvc_controller.mm",
        "source/UVCControllerCore/UVCController.m",
        "source/UVCControllerCore/UVCType.m",
        "source/UVCControllerCore/UVCValue.m"
      ],
      "include_dirs": [
        "source/UVCControllerCore/include"
      ],
      "link_settings": {
        "libraries": [
          "-framework Foundation",
          "-framework IOKit",
          "-framework CoreFoundation"
        ]
      },
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": [
          "-std=c++17",
          "-stdlib=libc++",
          "-fno-objc-arc"
        ],
        "OTHER_CFLAGS": [
          "-fno-objc-arc"
        ],
        "OTHER_LDFLAGS": [
          "-framework Foundation",
          "-framework IOKit",
          "-framework CoreFoundation"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "11.0",
        "ARCHS": ["x86_64", "arm64"]
      },
      "cflags+": ["-arch x86_64", "-arch arm64", "-fno-objc-arc"],
      "ldflags+": ["-arch x86_64", "-arch arm64"]
    }
  ]
}
