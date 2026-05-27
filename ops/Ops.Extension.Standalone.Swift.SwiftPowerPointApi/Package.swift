// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftPowerPointApi",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftPowerPointApi",
            path: "source/SwiftPowerPointApi",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
