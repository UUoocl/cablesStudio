// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftSyphonIn",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftSyphonIn",
            dependencies: [],
            path: "source"
        )
    ]
)
