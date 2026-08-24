import SwiftUI

struct CBFont {
    static func display() -> Font { .system(size: 30, weight: .heavy) }
    static func h1() -> Font { .system(size: 26, weight: .bold) }
    static func h2() -> Font { .system(size: 24, weight: .bold) }
    static func section() -> Font { .system(size: 19, weight: .semibold) }
    static func h3() -> Font { .system(size: 18, weight: .semibold) }
    static func body1() -> Font { .system(size: 16, weight: .medium) }
    static func body2() -> Font { .system(size: 14, weight: .regular) }
    static func caption1() -> Font { .system(size: 13, weight: .regular) }
    static func caption2() -> Font { .system(size: 12, weight: .regular) }
    static func badge() -> Font { .system(size: 11, weight: .semibold) }
    static func tab() -> Font { .system(size: 10, weight: .medium) }
}
