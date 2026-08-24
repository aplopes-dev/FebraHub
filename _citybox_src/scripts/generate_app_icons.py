#!/usr/bin/env python3
"""Generate CityBox launcher / app icons for Android and iOS."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]

ANDROID_RES = ROOT / "apps/marketplace/android/app/src/main/res"
IOS_ICON = ROOT / "apps/marketplace/ios/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png"

ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def scale_point(x: float, y: float, s: float) -> tuple[float, float]:
    return x * s, y * s


def draw_citybox_logo(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 143.0
    radius = max(1, int(34 * s))

    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=(0, 0, 0, 255))

    top = [
        scale_point(71.463, 30.228, s),
        scale_point(108.045, 44.351, s),
        scale_point(71.463, 58.478, s),
        scale_point(34.881, 44.351, s),
    ]
    left = [
        scale_point(34.878, 88.817, s),
        scale_point(68.120, 109.623, s),
        scale_point(68.120, 67.158, s),
        scale_point(53.172, 57.515, s),
        scale_point(34.880, 45.718, s),
        scale_point(34.878, 69.316, s),
    ]
    right = [
        scale_point(108.049, 88.820, s),
        scale_point(74.805, 109.623, s),
        scale_point(74.805, 67.158, s),
        scale_point(89.753, 57.515, s),
        scale_point(108.047, 45.718, s),
        scale_point(108.049, 69.316, s),
    ]

    for polygon in (top, left, right):
        draw.polygon(polygon, fill=(255, 255, 255, 255))

    return img


def save_png(path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    draw_citybox_logo(size).save(path, format="PNG")
    print(f"Wrote {path} ({size}x{size})")


def main() -> None:
    for folder, size in ANDROID_SIZES.items():
        base = ANDROID_RES / folder
        save_png(base / "ic_launcher.png", size)
        save_png(base / "ic_launcher_round.png", size)

    save_png(IOS_ICON, 1024)


if __name__ == "__main__":
    main()
