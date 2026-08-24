#!/usr/bin/env python3
"""Gera os PNGs da logo a partir de assets/images/logobrand.svg.

O Flutter não decodifica SVG sem uma dependência extra (`flutter_svg`), e não
vale carregar uma dependência inteira por um símbolo. Em vez disso mantemos o
SVG como fonte e geramos os três níveis de densidade que o Flutter resolve
sozinho em tempo de execução.

Rode depois de qualquer mudança no SVG:

    python3 tool/build_logo.py

Depende do GdkPixbuf com loader SVG (librsvg), presente em qualquer desktop
Linux com GTK. Em outra máquina, gere os PNGs com a ferramenta que tiver e
mantenha os mesmos caminhos e tamanhos.
"""

import os
import sys

import gi

gi.require_version("GdkPixbuf", "2.0")
from gi.repository import GdkPixbuf  # noqa: E402  (precisa vir após require_version)

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(PROJECT_DIR, "assets", "images", "logobrand.svg")

# 48 px é o tamanho 1x: o dobro do maior uso atual (24 px na barra de título),
# para sobrar margem se a logo crescer em outra tela.
VARIANTS = ((48, ""), (96, "@2x"), (144, "@3x"))


def main() -> int:
    if not os.path.exists(SOURCE):
        print(f"erro: {SOURCE} não encontrado", file=sys.stderr)
        return 1

    for size, subdir in VARIANTS:
        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(SOURCE, size, size, True)
        out_dir = os.path.join(PROJECT_DIR, "assets", "images", subdir)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "logobrand.png")
        pixbuf.savev(out_path, "png", [], [])
        print(f"gerado {os.path.relpath(out_path, PROJECT_DIR)} ({size}x{size})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
