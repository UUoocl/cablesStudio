// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftContourShuttleXpress",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftContourShuttleXpress",
            dependencies: [],
            path: "source",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
