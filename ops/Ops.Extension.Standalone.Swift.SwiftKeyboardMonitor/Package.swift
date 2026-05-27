// swift-tools-version: 6.3
import PackageDescription

let package = Package(
    name: "SwiftKeyboardMonitor",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftKeyboardMonitor",
            dependencies: [],
            path: "source",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
