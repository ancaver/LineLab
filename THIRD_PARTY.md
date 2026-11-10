# Dependencia gráfica de LINEALAB v1.0

Se distribuye **Plotly.js basic v2.35.2** como copia local, bajo licencia MIT.

- Archivo: `vendor/plotly-basic-2.35.2.min.js` (1 071 091 bytes).
- Licencia íntegra: `vendor/plotly-LICENSE.txt`.
- Copyright del archivo: 2012–2024 Plotly, Inc.; cabecera original conservada.
- Origen: https://cdn.plot.ly/plotly-basic-2.35.2.min.js
- Paquete oficial contrastado: https://registry.npmjs.org/plotly.js-basic-dist-min/-/plotly.js-basic-dist-min-2.35.2.tgz
- Código de la versión: https://github.com/plotly/plotly.js/tree/v2.35.2
- SHA-256: `138c2e81014b979dc00867a93da55b7605a17495ee78dd7afb433b7f021dfcfa`.

El archivo de CDN es idéntico byte a byte al `plotly-basic.min.js` del paquete npm
oficial. La licencia local se extrajo de ese mismo paquete. No se ha modificado
ni recompilado Plotly. La referencia interna del bundle a un archivo de notas de
licencia se mantiene tal como fue publicada por el distribuidor.

El paquete basic soporta las trazas scatter, zoom, hover y exportación PNG usadas
aquí. No interviene en las ecuaciones de LINEALAB ni en la exportación CSV.
No se cargan recursos remotos para ejecutar el proyecto. En CodePen se puede
usar el enlace CDN anterior como recurso externo, conservando esta atribución.
