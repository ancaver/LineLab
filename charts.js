/* Especificación Plotly pura: una magnitud y una unidad por eje vertical. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./sweep.js'));
  else root.LineaLabCharts = factory(root.LineaLabSweep);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (sweep) {
  'use strict';
  const PLOTLY_VERSION = '2.35.2';
  const PLOTLY_URL = 'https://cdn.plot.ly/plotly-basic-2.35.2.min.js';
  function buildPlot(analysis, key, scale) {
    const magnitude = sweep.MAGNITUDES.find(item => item.key === key);
    if (!magnitude || !['linear', 'log'].includes(scale)) throw new RangeError('Selecciona una magnitud y una escala horizontal válidas.');
    const unit = analysis.options.unit, factor = sweep.FREQUENCY_UNITS[unit];
    return {
      data: [{
        type: 'scatter', mode: 'lines+markers', name: `${magnitude.label} [${magnitude.unit}]`,
        x: analysis.rows.map(row => row.frequencyHz / factor),
        y: analysis.rows.map(row => sweep.getMagnitude(row, key)),
        connectgaps: false,
        line: { color: '#216cf3', width: 2 },
        marker: { size: 4, color: analysis.rows.map(row => row.warnings.length ? '#c69737' : '#216cf3') },
        customdata: analysis.rows.map(row => [`${row.warnings.length} aviso(s) del modelo`]),
        hovertemplate: `Frecuencia: %{x:.9g} ${unit}<br>${magnitude.label}: %{y:.10g} ${magnitude.unit}<br>%{customdata[0]}<extra>Modelo aproximado</extra>`
      }],
      layout: {
        title: { text: `${magnitude.label} frente a frecuencia`, font: { size: 14 } },
        font: { family: 'Segoe UI, Arial, sans-serif', size: 11, color: '#526b83' },
        paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff',
        margin: { l: 80, r: 25, t: 60, b: 95 }, height: 390,
        xaxis: { title: { text: `Frecuencia [${unit}]` }, type: scale, autorange: true, automargin: true, gridcolor: '#e9eef4', exponentformat: 'e' },
        yaxis: { title: { text: `${magnitude.label} [${magnitude.unit}]`, standoff: 12 }, type: 'linear', autorange: true, automargin: true, gridcolor: '#e9eef4', exponentformat: 'e' },
        showlegend: true, legend: { orientation: 'h', y: -0.22, x: 0 }, hovermode: 'closest', dragmode: 'zoom'
      },
      config: {
        responsive: true, displaylogo: false, displayModeBar: true, scrollZoom: true,
        modeBarButtonsToRemove: ['select2d', 'lasso2d'],
        toImageButtonOptions: { format: 'png', filename: `LINEALAB-${key}`, width: 1100, height: 600, scale: 2 }
      }
    };
  }
  return Object.freeze({ PLOTLY_VERSION, PLOTLY_URL, buildPlot });
});
