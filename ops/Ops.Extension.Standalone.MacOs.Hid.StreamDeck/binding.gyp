{
  "targets": [
    {
      "target_name": "streamdeck_hid",
      "sources": [
        "src/streamdeck_hid.mm"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "13.0",
        "CLANG_ENABLE_OBJC_ARC": "YES",
        "OTHER_CPLUSPLUSFLAGS": [
          "-std=c++17",
          "-stdlib=libc++",
          "-ObjC++",
          "-fobjc-arc"
        ],
        "OTHER_CFLAGS": [
          "-fobjc-arc"
        ],
        "OTHER_LDFLAGS": [
          "-framework Cocoa",
          "-framework IOKit"
        ]
      },
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    }
  ]
}
