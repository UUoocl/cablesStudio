// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftSyphonOut",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftSyphonOut",
            dependencies: [],
            path: "source"
        )
    ]
)
