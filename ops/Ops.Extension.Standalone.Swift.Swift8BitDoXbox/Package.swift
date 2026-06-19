// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Swift8BitDoXbox",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .target(
            name: "XboxControllerCore",
            path: "source/XboxControllerCore",
            publicHeadersPath: "include",
            cSettings: [
                .unsafeFlags(["-fno-objc-arc"]) // Allow direct memory management for raw pointers
            ],
            linkerSettings: [
                .linkedFramework("IOKit"),
                .linkedFramework("Foundation")
            ]
        ),
        .executableTarget(
            name: "Swift8BitDoXbox",
            dependencies: ["XboxControllerCore"],
            path: "source/Swift8BitDoXbox",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
