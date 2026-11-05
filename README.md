# AAJ! — web para GitHub y Cloudflare Pages

Sitio estático HTML/CSS/JS. No requiere instalación, compilación ni base de datos.
Paquete preparado el 5 de noviembre de 2026 (Lima).

## Origen y conservación

Fuente: VERSIONES-WEB/AAJ-web_v013_2026-11-03_22-00.zip, última versión numerada disponible (3 de noviembre, 22:00 Lima). Se conservan todos sus archivos y rutas, imágenes, SVG, fuentes, estilos e interacciones. Los archivos de diseño y programación no se reconstruyeron.
Cambios para publicación: se quitó el prefijo «Experimental ·» de los títulos, se retiró noindex/nofollow de ambas páginas y se cambió robots.txt para permitir indexación. Se añadieron este README y .gitignore. No se incluyeron servidores locales, perfiles de navegador ni respaldos de otras carpetas: no forman parte del ZIP fuente v013.

## Subir a GitHub

1. Extraer este ZIP completo.
2. Crear un repositorio llamado aaj-web en la cuenta u organización de AAJ!.
3. Subir el CONTENIDO extraído a la raíz del repositorio, conservando assets/ y sus subcarpetas. No subir el ZIP como archivo ni añadir una carpeta contenedora.
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

El dominio definitivo no consta en los archivos revisados. Después de verificar pages.dev, añadir el dominio en Custom domains del proyecto Pages y seguir la configuración DNS indicada por Cloudflare. Para un dominio raíz gestionado en Cloudflare, añadir antes la zona y sustituir en Porkbun los nameservers por los asignados a esa zona. Conservar los registros de correo existentes. Verificar HTTPS y decidir la dirección principal (con o sin www).

Cuando se conozca esa dirección, añadir canonical y og:url a las dos páginas, convertir og:image a URL absoluta y generar sitemap.xml con URLs reales. No se ha inventado un dominio ni un sitemap.

## Edición

- index.html: inicio y secciones del proyecto.
- convocatoria.html: convocatoria 2027.
- site-config.js: PDF de bases, Instagram y fotografías del carrusel.
- assets/: imágenes, gráficos y tipografías locales. Conservar nombres y mayúsculas.
- Mantener todos los CSS y JS suministrados: los estilos e interacciones están repartidos entre varios archivos.

## Contenidos pendientes existentes

- PDF definitivo de bases 2027: basesUrl está vacío. El botón conserva el aviso «Las bases estarán disponibles próximamente»; para descargar un PDF hay que aportar el documento y configurar su ruta o URL en site-config.js.
- El manual previo del proyecto señala pendiente la foto de Gaby Cepeda y la posible incorporación de enlaces del jurado y fechas del cronograma. Revisar y aportar el contenido definitivo; este paquete no inventa esos recursos.
- Dominio definitivo y metadatos sociales absolutos, como se explica arriba.

## Comprobación

Se verifican las rutas locales HTML/CSS/JS, los recursos del carrusel, los identificadores de anclas, la conservación binaria de recursos y la ausencia de direcciones locales. Esto no sustituye la revisión visual y de interacciones en pages.dev ni acredita un despliegue: no se ha publicado el sitio desde este paquete.