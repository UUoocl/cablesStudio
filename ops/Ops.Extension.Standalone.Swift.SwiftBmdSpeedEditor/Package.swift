// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftBmdSpeedEditor",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftBmdSpeedEditor",
            dependencies: [],
            path: "source",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
