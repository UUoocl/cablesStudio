// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftStreamDeck",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "SwiftStreamDeck", targets: ["SwiftStreamDeck"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftStreamDeck",
            dependencies: ["Codedeck"],
            path: "source/Main",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        .target(
            name: "Codedeck",
            dependencies: ["HIDSwift"],
            path: "source/Codedeck"
        ),
        .target(
            name: "HIDSwift",
            dependencies: [],
            path: "source/HIDSwift"
        )
    ]
)
