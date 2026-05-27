// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftHumanHand",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftHumanHand",
            dependencies: [],
            path: "source"
        )
    ]
)
