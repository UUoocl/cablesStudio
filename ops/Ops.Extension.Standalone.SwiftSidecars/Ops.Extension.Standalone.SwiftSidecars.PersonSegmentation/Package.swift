// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CablesPersonSegmentation",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "CablesPersonSegmentation",
            dependencies: [],
            path: "source"
        )
    ]
)
