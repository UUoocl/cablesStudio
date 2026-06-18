// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftContourShuttle",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftContourShuttle",
            dependencies: [],
            path: "source",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
