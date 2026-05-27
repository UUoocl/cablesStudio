// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftSpeechToText",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "SwiftSpeechToText",
            dependencies: [],
            path: "source",
            linkerSettings: [
                .unsafeFlags([
                    "-Xlinker", "-sectcreate",
                    "-Xlinker", "__TEXT",
                    "-Xlinker", "__info_plist",
                    "-Xlinker", "source/Info.plist"
                ])
            ]
        )
    ]
)
