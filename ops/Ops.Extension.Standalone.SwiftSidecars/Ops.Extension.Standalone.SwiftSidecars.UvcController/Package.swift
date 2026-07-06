// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CablesUvcController",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .target(
            name: "UVCControllerCore",
            path: "source/UVCControllerCore",
            publicHeadersPath: "include",
            cSettings: [
                .unsafeFlags(["-fno-objc-arc"])
            ],
            linkerSettings: [
                .linkedFramework("IOKit"),
                .linkedFramework("Foundation")
            ]
        ),
        .executableTarget(
            name: "CablesUvcController",
            dependencies: ["UVCControllerCore"],
            path: "source/SwiftUvcController",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
