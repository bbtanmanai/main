from __future__ import annotations

from pathlib import Path

from PIL import Image


def convert_dir(src_dir: Path) -> int:
    count = 0
    for p in src_dir.glob("*.png"):
        out = p.with_suffix(".webp")
        img = Image.open(p)
        has_alpha = (img.mode in ("RGBA", "LA")) or (img.mode == "P" and "transparency" in img.info)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if has_alpha else "RGB")
        save_kwargs: dict = {"format": "WEBP", "quality": 90, "method": 6}
        if has_alpha:
            save_kwargs["lossless"] = True
        img.save(out, **save_kwargs)
        print(f"{p.name} -> {out.name} ({img.size[0]}x{img.size[1]})")
        count += 1
    return count


def main() -> None:
    src_dir = Path(r"c:\LinkDropV2\apps\web\public\img\biz\idea")
    total = convert_dir(src_dir)
    print(f"converted: {total}")


if __name__ == "__main__":
    main()

