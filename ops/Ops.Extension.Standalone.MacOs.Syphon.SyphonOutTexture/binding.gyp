{
  "targets": [
    {
      "target_name": "syphon_texture_server",
      "sources": [
        "src/syphon_texture_server.mm"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<(module_root_dir)/Frameworks/Syphon.framework/Headers",
        "<(module_root_dir)/Frameworks/Syphon.framework/Versions/A/Headers"
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
          "-fobjc-arc",
          "-F<(module_root_dir)/Frameworks"
        ],
        "OTHER_CFLAGS": [
          "-fobjc-arc",
          "-F<(module_root_dir)/Frameworks"
        ],
        "OTHER_LDFLAGS": [
          "-framework Cocoa",
          "-framework AppKit",
          "-framework Metal",
          "-framework QuartzCore",
          "-framework CoreVideo",
          "-framework IOSurface",
          "-F<(module_root_dir)/Frameworks",
          "-framework Syphon",
          "-Wl,-rpath,@loader_path/Frameworks",
          "-Wl,-rpath,@loader_path/../Frameworks",
          "-Wl,-rpath,@loader_path/../../Frameworks",
          "-Wl,-rpath,@executable_path/Frameworks",
          "-Wl,-rpath,@executable_path/../Frameworks"
        ]
      },
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    }
  ]
}
