# DiscursApp — sitio publicado

Esta rama (`main`) contiene el **build estático** que sirve GitHub Pages:

https://axelrodriguez52.github.io/Discursapp/

El código fuente de la versión Next.js está en la rama **`nextjs`**.

- Contactos: vista React real con store externo.
- Splash: animación mejorada solo con CSS.
- Compilado con `NEXT_BASE_PATH=/Discursapp` para la subruta de GitHub Pages.

Para actualizar el sitio, reconstruye con esa variable y copia el contenido de `out/` en la
raíz de esta rama.

La versión anterior (HTML único) quedó en el tag `legacy-html-2026-10-21`.
