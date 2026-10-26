#!/usr/bin/env python3
"""
renombrar_fotos.py

Renombra las fotos de cada carpeta "fotos-..." al patrón que usa la web
para encontrarlas sola: NOMBRE-CARPETA_1.ext, NOMBRE-CARPETA_2.ext, ...

No importa cómo se llamaban tus archivos antes, ni el orden en el que
los pongas: se renumeran del 1 en adelante (orden alfabético de cómo
estaban antes de renombrar), conservando la extensión real de cada foto
(jpg, jpeg, png, webp, gif).

No hace falta decirle qué carpetas usar: busca solas, en la misma
carpeta donde está este script, todas las que empiecen con "fotos-".
Por eso funciona igual para las 5 áreas actuales (fotos-ceredi,
fotos-servicios-complementarios, fotos-labor-talleres, fotos-recreacion,
fotos-repositorios) y para cualquier área nueva que agregues después.

Uso:
    python3 renombrar_fotos.py

Se puede correr las veces que haga falta — por ejemplo, después de
agregar fotos nuevas a una carpeta — y vuelve a numerar todo de 1 a N
sin duplicar ni perder ningún archivo.
"""
import os
import sys

EXTENSIONES_VALIDAS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
RAIZ = os.path.dirname(os.path.abspath(__file__))


def encontrar_carpetas_de_fotos(raiz):
    carpetas = []
    for nombre in sorted(os.listdir(raiz)):
        ruta = os.path.join(raiz, nombre)
        if os.path.isdir(ruta) and nombre.startswith('fotos-'):
            carpetas.append(ruta)
    return carpetas


def listar_fotos(carpeta):
    archivos = []
    for nombre in sorted(os.listdir(carpeta)):
        ruta = os.path.join(carpeta, nombre)
        ext = os.path.splitext(nombre)[1].lower()
        if os.path.isfile(ruta) and ext in EXTENSIONES_VALIDAS:
            archivos.append(nombre)
    return archivos


def renombrar_carpeta(carpeta):
    prefijo = os.path.basename(carpeta)  # p.ej. "fotos-ceredi"
    archivos = listar_fotos(carpeta)

    if not archivos:
        print(f'  - {prefijo}/  (vacía, no hay fotos todavía)')
        return

    # Paso 1: mover todo a nombres temporales, para no pisar un archivo
    # que por casualidad ya se llame igual al nombre final de otro.
    temporales = []
    for i, nombre in enumerate(archivos):
        ext = os.path.splitext(nombre)[1].lower()
        tmp = f'__tmp_{i}{ext}'
        os.rename(os.path.join(carpeta, nombre), os.path.join(carpeta, tmp))
        temporales.append(tmp)

    # Paso 2: nombre final definitivo, numerado del 1 en adelante.
    for i, tmp in enumerate(temporales, start=1):
        ext = os.path.splitext(tmp)[1].lower()
        final = f'{prefijo}_{i}{ext}'
        os.rename(os.path.join(carpeta, tmp), os.path.join(carpeta, final))

    print(f'  - {prefijo}/  {len(archivos)} fotos -> {prefijo}_1.* .. {prefijo}_{len(archivos)}.*')


def main():
    carpetas = encontrar_carpetas_de_fotos(RAIZ)
    if not carpetas:
        print('No encontré ninguna carpeta "fotos-..." junto a este script.')
        print('Asegurate de correrlo parado adentro de la carpeta del proyecto (igemaexpo/).')
        sys.exit(1)

    print('Carpetas de fotos encontradas:\n')
    for c in carpetas:
        n = len(listar_fotos(c))
        print(f'  - {os.path.basename(c)}  ({n} fotos)')

    resp = input('\n¿Renombrar las fotos de estas carpetas ahora? [s/N] ').strip().lower()
    if resp != 's':
        print('Cancelado, no se tocó nada.')
        return

    print()
    for c in carpetas:
        renombrar_carpeta(c)

    print('\nListo. Ahora subí (o actualizá) el proyecto en Vercel y la web va a encontrar las fotos sola.')


if __name__ == '__main__':
    main()
