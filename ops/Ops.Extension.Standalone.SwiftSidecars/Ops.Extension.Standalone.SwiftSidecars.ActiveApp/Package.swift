// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CablesActiveAppMonitor",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "CablesActiveAppMonitor",
            dependencies: [],
            path: "source"
        )
    ]
)
