// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "mitate",
    platforms: [
        .macOS(.v15)
    ],
    products: [
        .library(
            name: "MitateCore",
            targets: ["MitateCore"]
        ),
        .executable(
            name: "mitate",
            targets: ["MitateCLI"]
        )
    ],
    targets: [
        .target(
            name: "MitateCore",
            path: "Sources/MitateCore",
            linkerSettings: [
                .linkedLibrary("sqlite3")
            ]
        ),
        .executableTarget(
            name: "MitateCLI",
            dependencies: ["MitateCore"],
            path: "Sources/MitateCLI"
        ),
        .testTarget(
            name: "MitateCoreTests",
            dependencies: ["MitateCore"],
            path: "Tests/MitateCoreTests"
        )
    ]
)
