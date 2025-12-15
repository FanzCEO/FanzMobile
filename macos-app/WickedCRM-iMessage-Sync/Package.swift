// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "WickedCRM-iMessage-Sync",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "WickedCRM-iMessage-Sync", targets: ["WickedCRM-iMessage-Sync"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "WickedCRM-iMessage-Sync",
            dependencies: [],
            path: "Sources"
        )
    ]
)
