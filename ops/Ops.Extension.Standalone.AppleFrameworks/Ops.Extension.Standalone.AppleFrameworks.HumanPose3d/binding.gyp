{
  "targets": [
    {
      "target_name": "human_pose3d",
      "sources": [ "human_pose3d.mm" ],
      "link_settings": {
        "libraries": [
          "-framework CoreGraphics",
          "-framework CoreVideo",
          "-framework Vision",
          "-framework Foundation",
          "-framework ApplicationServices"
        ]
      },
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": ["-std=c++17", "-stdlib=libc++"],
        "OTHER_LDFLAGS": [
          "-framework CoreGraphics",
          "-framework CoreVideo",
          "-framework Vision",
          "-framework Foundation",
          "-framework ApplicationServices"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "14.0"
      },
      "cflags+": ["-arch x86_64", "-arch arm64"],
      "ldflags+": ["-arch x86_64", "-arch arm64"],
      "xcode_settings": {
        "ARCHS": ["x86_64", "arm64"]
      }
    }
  ]
}
