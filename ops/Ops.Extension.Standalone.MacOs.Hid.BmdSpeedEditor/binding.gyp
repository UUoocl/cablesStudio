{
  "targets": [
    {
      "target_name": "bmd_speed_editor",
      "sources": [
        "bmd_speed_editor.mm"
      ],
      "link_settings": {
        "libraries": [
          "-framework IOKit",
          "-framework Foundation"
        ]
      },
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": [
          "-std=c++17",
          "-stdlib=libc++"
        ],
        "OTHER_LDFLAGS": [
          "-framework IOKit",
          "-framework Foundation"
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
