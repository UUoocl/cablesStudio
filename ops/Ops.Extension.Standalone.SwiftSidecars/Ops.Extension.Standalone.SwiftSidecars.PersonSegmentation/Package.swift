// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftPersonSegmentation",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftPersonSegmentation",
            dependencies: [],
            path: "source"
        )
    ]
)
