// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftHumanFace",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftHumanFace",
            dependencies: [],
            path: "source"
        )
    ]
)
