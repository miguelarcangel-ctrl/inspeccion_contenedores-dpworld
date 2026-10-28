"""Íconos de app instalable, iguales para todas las apps DP World Panamá (skill linea-grafica).

Mismo fondo índigo #1A1060, logo DP World en blanco, línea verde #00C389 y el nombre corto de la app
en Barlow Condensed 800 mayúsculas. Todo dentro de la zona segura de los íconos «maskable».

Uso:  python3 generar_iconos.py "HORAS" carpeta_destino
Genera icon-512.png, icon-192.png, apple-touch-icon.png (180) y favicon-32.png.
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
INDIGO, VERDE, BLANCO = (26, 16, 96), (0, 195, 137), (255, 255, 255)


def icono(nombre, lado=512):
    im = Image.new("RGBA", (lado, lado), INDIGO + (255,))
    d = ImageDraw.Draw(im)
    logo = Image.open(os.path.join(AQUI, "..", "assets", "dpworld-logo-fondo-oscuro.png")).convert("RGBA")
    ancho = int(lado * 0.46)
    logo = logo.resize((ancho, int(logo.height * ancho / logo.width)), Image.LANCZOS)
    y_logo = int(lado * 0.22)
    im.alpha_composite(logo, ((lado - ancho) // 2, y_logo))
    # línea verde bajo el logo
    y_lin = y_logo + logo.height + int(lado * 0.045)
    d.rectangle([(lado - lado * 0.12) / 2, y_lin, (lado + lado * 0.12) / 2, y_lin + max(2, lado * 0.012)], fill=VERDE)
    # nombre corto: el tamaño se ajusta para no salir de la zona segura (72 % del ancho)
    fuente_ruta = os.path.join(AQUI, "barlow-condensed-800.woff")
    t = int(lado * 0.17)
    while True:
        f = ImageFont.truetype(fuente_ruta, t)
        caja = d.textbbox((0, 0), nombre, font=f)
        if caja[2] - caja[0] <= lado * 0.72 or t < 8:
            break
        t -= 2
    w = caja[2] - caja[0]
    d.text(((lado - w) / 2 - caja[0], y_lin + int(lado * 0.05) - caja[1]), nombre, font=f, fill=BLANCO)
    return im


def generar(nombre, destino):
    os.makedirs(destino, exist_ok=True)
    grande = icono(nombre.upper(), 512)
    grande.convert("RGB").save(os.path.join(destino, "icon-512.png"))
    for archivo, lado in (("icon-192.png", 192), ("apple-touch-icon.png", 180)):
        icono(nombre.upper(), lado).convert("RGB").save(os.path.join(destino, archivo))
    # favicon: solo el fondo índigo y la línea verde con la inicial, legible a 32 px
    fav = Image.new("RGB", (32, 32), INDIGO)
    d = ImageDraw.Draw(fav)
    f = ImageFont.truetype(os.path.join(AQUI, "barlow-condensed-800.woff"), 24)
    c = d.textbbox((0, 0), nombre[0].upper(), font=f)
    d.text(((32 - (c[2] - c[0])) / 2 - c[0], 3 - c[1] + 2), nombre[0].upper(), font=f, fill=BLANCO)
    d.rectangle([9, 27, 23, 28], fill=VERDE)
    fav.save(os.path.join(destino, "favicon-32.png"))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    generar(sys.argv[1], sys.argv[2])
