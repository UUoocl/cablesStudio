// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftSoomfonController",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "SwiftSoomfonController", targets: ["SwiftSoomfonController"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftSoomfonController",
            dependencies: [],
            path: "source",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
