// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "mitate",
    platforms: [
        .macOS("27.2")
    ],
    products: [
        .library(
            name: "MitateCore",
            targets: ["MitateCore", "MitateMetal", "MitateWeb"]
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
        .target(
            name: "MitateMetal",
            dependencies: ["MitateCore"],
            path: "Sources/MitateMetal",
            linkerSettings: [
                .linkedFramework("Metal"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("CoreText"),
                .linkedFramework("ImageIO"),
                .linkedFramework("AVFoundation"),
                .linkedFramework("CoreVideo"),
                .linkedFramework("UniformTypeIdentifiers")
            ]
        ),
        .target(
            name: "MitateWeb",
            dependencies: ["MitateCore"],
            path: "Sources/MitateWeb"
        ),
        .executableTarget(
            name: "MitateCLI",
            dependencies: ["MitateCore", "MitateMetal", "MitateWeb"],
            path: "Sources/MitateCLI"
        ),
        .testTarget(
            name: "MitateCoreTests",
            dependencies: ["MitateCore", "MitateMetal", "MitateWeb"],
            path: "Tests/MitateCoreTests"
        )
    ]
)
