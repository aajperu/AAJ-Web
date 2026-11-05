# AAJ! — web para GitHub y Cloudflare Pages

Sitio estático HTML/CSS/JS. No requiere instalación, compilación ni base de datos.
Paquete preparado el 5 de noviembre de 2026 (Lima).

## Origen y conservación

Fuente: VERSIONES-WEB/AAJ-web_v013_2026-11-03_22-00.zip, última versión numerada disponible (3 de noviembre, 22:00 Lima). Se conservan todos sus archivos y rutas, imágenes, SVG, fuentes, estilos e interacciones. Los archivos de diseño y programación no se reconstruyeron.
Cambios para publicación: se quitó el prefijo «Experimental ·» de los títulos, se retiró noindex/nofollow de ambas páginas y se cambió robots.txt para permitir indexación. Se añadieron este README y .gitignore. No se incluyeron servidores locales, perfiles de navegador ni respaldos de otras carpetas: no forman parte del ZIP fuente v013.

## Subir a GitHub

1. Usar el contenido completo de esta carpeta, que contiene la versión final vigente.
2. Abrir el repositorio aajperu/AAJ-Web en la rama main.
3. Subir el CONTENIDO de esta carpeta a la raíz del repositorio, conservando assets/ y sus subcarpetas. No subir el ZIP como archivo ni añadir una carpeta contenedora.
4. Confirmar que index.html y convocatoria.html aparecen directamente en la raíz, junto con los CSS, JS y assets/.
5. Guardar en la rama main. Si se usa la web de GitHub, comprobar que .gitignore también se haya incluido: algunos exploradores ocultan archivos cuyo nombre empieza con punto.

## Cloudflare Pages mediante GitHub

En Workers & Pages, crear una aplicación Pages e importar el repositorio de GitHub.

- Rama de producción: main.
- Framework preset: None.
- Root directory: dejar vacío (raíz del repositorio).
- Build command: exit 0.
- Build output directory: .
- Variables de entorno: ninguna.

Publicar y comprobar la dirección asignada pages.dev: inicio, convocatoria, menú móvil, enlaces, carrusel, ventanas emergentes y animaciones, tanto en móvil como en escritorio. No hace falta package.json ni configuración de Wrangler.

Referencia oficial: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

## Dominio de Porkbun

El dominio principal configurado es https://aaj.lat. Ambas páginas incluyen canonical, Open Graph y Twitter con URLs absolutas. robots.txt apunta a https://aaj.lat/sitemap.xml, que contiene / y /convocatoria. La imagen social está en assets/social.jpg.

La configuración de estos archivos no acredita que el dominio esté conectado ni que el despliegue esté publicado.

## Edición

- index.html: inicio y secciones del proyecto.
- convocatoria.html: convocatoria 2027.
- site-config.js: PDF de bases, Instagram y fotografías del carrusel.
- assets/: imágenes, gráficos y tipografías locales. Conservar nombres y mayúsculas.
- Mantener todos los CSS y JS suministrados: los estilos e interacciones están repartidos entre varios archivos.

## Contenidos pendientes existentes

- PDF definitivo de bases 2027: basesUrl está vacío. El botón conserva el aviso «Las bases estarán disponibles próximamente»; para descargar un PDF hay que aportar el documento y configurar su ruta o URL en site-config.js.
- Foto de Gaby Cepeda incorporada en index.html: assets/images/GABY-7f3f3b.jpg. Revisar los enlaces del jurado y las fechas del cronograma cuando se entregue contenido definitivo.
- Dominio y metadatos configurados para https://aaj.lat.

## Comprobación

Se verifican las rutas locales HTML/CSS/JS, los recursos del carrusel, los identificadores de anclas, la conservación binaria de recursos y la ausencia de direcciones locales. Esto no sustituye la revisión visual y de interacciones en pages.dev ni acredita un despliegue: no se ha publicado el sitio desde este paquete.