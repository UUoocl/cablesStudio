// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftHumanPose2d",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftHumanPose2d",
            dependencies: [],
            path: "source"
        )
    ]
)
