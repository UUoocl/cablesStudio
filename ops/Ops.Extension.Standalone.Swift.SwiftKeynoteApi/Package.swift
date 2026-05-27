// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftKeynoteApi",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftKeynoteApi",
            path: "source/SwiftKeynoteApi",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
