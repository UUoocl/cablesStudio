// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftHumanPose3d",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftHumanPose3d",
            dependencies: [],
            path: "source"
        )
    ]
)
