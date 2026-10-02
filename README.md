# ✦ Escrito en las estrellas

Un regalo interactivo en forma de cielo nocturno. Cada recuerdo es una estrella:
al tocarla se abre su foto con un mensaje, y al encenderlas todas descubre que
juntas dibujan un corazón. Al final las fotos forman un mosaico en forma de
corazón y aparece una carta.

## Cómo se vive

1. **Portada.** Una luna con su foto, el título y el botón *Mirar al cielo*.
2. **Viaje.** Un salto al espacio con la música empezando.
3. **Prólogo.** Unas frases que aparecen letra por letra.
4. **El cielo.** Las estrellas laten. Al tocar una, la cámara se acerca y se abre
   el recuerdo. Al cerrarlo, la estrella vuela a su lugar y se une a sus vecinas.
5. **Estrellas fugaces.** Si toca una, aparece un deseo.
6. **Final.** El corazón se ilumina, late, y las fotos se colocan sobre él.
7. **Carta.** Una carta final con polaroids y, si quieres, un contador del tiempo juntos.

El progreso se guarda en el navegador, así que puede cerrar y volver.

## Cómo editarlo

Todo lo personal está en **`assets/config.js`**:

- Textos de la portada, el prólogo, la frase final y la carta.
- `RECUERDOS`: foto, título y mensaje de cada estrella. Puedes poner más o menos; el corazón se adapta.
- `fechaInicio`: pon la fecha en que empezaron (`"2024-02-14"`) para mostrar el contador en la carta.
- `deseos`: frases que salen al tocar una estrella fugaz.
- `FOTOS_EXTRA`: las polaroids que salen sobre la carta.

Las fotos y la canción van en `assets/fotos/`.

## Cómo abrirlo

Abre `index.html` en el navegador, o publícalo con GitHub Pages
(Settings → Pages → rama `main`, carpeta raíz) y envíale el enlace.
Se ve mejor en el celular, con sonido.

Para volver a verlo desde cero, toca *Empezar de nuevo* al final de la carta.
