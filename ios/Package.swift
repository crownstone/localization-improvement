// swift-tools-version:5.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "localization",
    dependencies: [
        .package(
            url: "https://github.com/apple/swift-argument-parser",
            from: "0.4.0"
        ),
        .package(
            url: "https://github.com/SwiftyJSON/SwiftyJSON",
            .exact("5.0.0")
        ),
        .package(
            name: "BluenetBasicLocalization", 
            path:"/Users/alex/Dropbox/Crownstone/Projects/XCode/CrownstoneLocalizationIOS/"
        )
    ],
    targets: [
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages this package depends on.
        .target(
            name: "localization",
            dependencies: [
                .product(name: "ArgumentParser", package: "swift-argument-parser"),
                "SwiftyJSON",
                "BluenetBasicLocalization"
            ])
    ]
)
