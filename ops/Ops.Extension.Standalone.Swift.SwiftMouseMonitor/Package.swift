// swift-tools-version: 6.3
import PackageDescription

let package = Package(
    name: "SwiftMouseMonitor",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftMouseMonitor",
            dependencies: [],
            path: "source",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
