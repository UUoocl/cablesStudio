{
  "targets": [
    {
      "target_name": "8bitdo_xbox",
      "sources": [
        "8bitdo_xbox.mm",
        "XboxControllerCore.m"
      ],
      "include_dirs": [
        "include"
      ],
      "link_settings": {
        "libraries": [
          "-framework IOKit",
          "-framework Foundation"
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
          "-framework Foundation"
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
