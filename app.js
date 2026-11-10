/* Etapa 3: controles y vistas. Motores puros en calculations.js y secondary.js. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const form = $('#configuration-form');
const engine = globalThis.LineaLabCalculations;
const secondaryEngine = globalThis.LineaLabSecondary;
const primaryKeys = ['R', 'L', 'C', 'G'];
const secondaryKeys = ['Z0', 'gamma', 'alpha', 'beta', 'phaseVelocity', 'wavelength'];
let lastResults = null;
const primary = [ ['Resistencia','R′','Ω/m'], ['Inductancia','L′','H/m'], ['Capacitancia','C′','F/m'], ['Conductancia','G′','S/m'] ];
const secondary = [ ['Impedancia característica','Z₀','Ω'], ['Constante de propagación','γ','m⁻¹'], ['Atenuación','α','Np/m'], ['Constante de fase','β','rad/m'], ['Velocidad de fase','vₚ','m/s'], ['Longitud de onda','λ','m'] ];
// Esquemas ilustrativos sin escala. Los valores iniciales son entradas de ejemplo.
const geometries = {
 bifilar: { title:'Línea bifilar', description:'Dos conductores paralelos separados por un medio dieléctrico.', fields:[['radius','Radio del conductor (a)',0.5],['separation','Distancia entre centros (D)',5]], drawing:'<circle cx="76" cy="70" r="27"/><circle cx="224" cy="70" r="27"/><path d="M76 70h27M76 39V22M224 39V22M76 27h148m-142-4-6 4 6 4m136-8 6 4-6 4"/><text x="150" y="19">D</text><text x="89" y="64">a</text><text x="76" y="117">Conductor</text><text x="224" y="117">Conductor</text><path class="dashed" d="M38 70h30m43 0h78m43 0h30"/>' },
 coaxial: { title:'Línea coaxial', description:'Conductores concéntricos con un medio dieléctrico entre ambos.', fields:[['innerRadius','Radio del conductor interior (a)',0.5],['outerRadius','Radio interno del conductor exterior (b)',2]], drawing:'<circle cx="150" cy="70" r="54"/><circle cx="150" cy="70" r="46"/><circle cx="150" cy="70" r="15"/><path d="M150 70h15M150 70l33-33"/><text x="160" y="85">a</text><text x="176" y="47">b</text><path class="dashed" d="M80 70h55m30 0h55"/><text x="150" y="140">Dieléctrico entre conductores</text>' },
 placas: { title:'Línea de placas paralelas', description:'Dos placas conductoras separadas por un medio dieléctrico.', fields:[['width','Ancho de las placas (w)',20],['gap','Separación entre placas (d)',1]], drawing:'<path class="plate" d="M55 42h190M55 100h190"/><path d="M55 30V15M245 30V15M55 20h190M258 42h20M258 100h20M271 42v58m-210-26-6 4 6 4m178-8 6 4-6 4m22 24 4-6 4 6m-8 46 4 6 4-6"/><text x="150" y="13">w</text><text x="286" y="75">d</text><text x="150" y="78">Dieléctrico</text>' }
};
let selectedType = 'bifilar';
const status = (message, state = '') => {
  $('#form-status').textContent = message;
  $('#form-status').className = `form-status ${state}`;
};

function clearErrors() {
  form.querySelectorAll('.error').forEach(node => { node.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
}

function changeGeometry(type) {
 selectedType=type;
 const geometry=geometries[type];
 document.querySelectorAll('.line-option').forEach(button => { const active=button.dataset.type===type; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
 $('#geometry-fields').innerHTML=geometry.fields.map(([id,label,value]) => `<label for="${id}">${label}</label><div class="input-with-unit"><input id="${id}" name="${id}" type="number" min="0" step="any" value="${value}" required aria-describedby="${id}-error"><span class="unit">mm</span></div><small class="error" id="${id}-error"></small>`).join('');
 $('#diagram-title').textContent=geometry.title;
 $('#diagram-description').textContent=geometry.description;
 $('#line-diagram').innerHTML=`<svg viewBox="0 0 300 150" role="img" aria-label="${geometry.title}: sección transversal sin escala"><style>#line-diagram circle{fill:#216cf30b;stroke:#548dd5;stroke-width:1.6}#line-diagram path{fill:none;stroke:#7b9cbe;stroke-width:1}#line-diagram text{font:10px 'Segoe UI',Arial;fill:#7892ad;text-anchor:middle}#line-diagram .dashed{stroke-dasharray:3 4;opacity:.6}#line-diagram .plate{stroke:#548dd5;stroke-width:8}</style>${geometry.drawing}</svg>`;
 clearErrors(); invalidateResults(); status('Configura la línea para comenzar.');
}

// Los selectores cargan valores orientativos; los campos numéricos son editables.
function loadConductor() {
  $('#conductivity').value = engine.CONDUCTORS[$('#conductor').value].conductivity;
}
function loadDielectric() {
  const material = engine.DIELECTRICS[$('#dielectric').value];
  $('#relativePermittivity').value = material.relativePermittivity;
  $('#lossTangent').value = material.lossTangent;
}
function readConfiguration() {
  return {
    type: selectedType,
    frequency: $('#frequency').valueAsNumber,
    frequencyUnit: $('#frequency-unit').value,
    conductivity: $('#conductivity').valueAsNumber,
    relativePermittivity: $('#relativePermittivity').valueAsNumber,
    lossTangent: $('#lossTangent').valueAsNumber,
    length: $('#length').valueAsNumber,
    geometry: Object.fromEntries(geometries[selectedType].fields.map(([id]) => [id, $(`#${id}`).valueAsNumber]))
  };
}

// Notación científica a seis cifras significativas; cero se muestra como cero.
function formatNumber(value) {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e-2 && Math.abs(value) < 1e5) return String(Number(value.toPrecision(6)));
  const [mantissa, exponent] = value.toExponential(5).split('e');
  const superscript = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const power = String(Number(exponent)).split('').map(char => superscript[char]).join('');
  return `${mantissa} × 10${power}`;
}
function complexTerms(value) {
  return [formatNumber(value.re), `${value.im < 0 ? '−' : '+'} j ${formatNumber(Math.abs(value.im))}`];
}
function secondaryValue(key, results, stacked = false) {
  if (key !== 'Z0' && key !== 'gamma') return formatNumber(results[key]);
  const terms = complexTerms(results[key]);
  return stacked ? terms.map(term => `<span class="complex-component">${term}</span>`).join('') : terms.join(' ');
}
function secondaryExtras(key, results) {
  if (key === 'Z0') return [
    `|Z₀| = ${formatNumber(results.Z0Magnitude)} Ω`,
    `∠Z₀ = ${formatNumber(results.Z0PhaseDegrees)}°`
  ];
  if (key === 'alpha') return [`${formatNumber(results.alphaDb)} dB/m`];
  return [];
}
function renderCards(target, metrics, results = null) {
  $(target).innerHTML = metrics.map(([name, symbol, unit], index) => {
    const key = primaryKeys[index];
    let note = 'Modelo TEM ideal';
    if (key === 'R') note = 'Alta frecuencia · aprox.';
    else if (key === 'G') note = 'Modelo dieléctrico';
    else if (selectedType === 'placas') note = 'Placas anchas · aprox.';
    const value = results
      ? `<p class="metric-value" data-primary-value="${key}">${formatNumber(results[key])}</p><span class="metric-computed-note">${note}</span>`
      : '<span class="pending">Pendiente de cálculo</span>';
    return `<article class="metric"><div class="metric-top"><span class="metric-symbol">${symbol}</span><span class="metric-unit">${unit}</span></div><h3>${name}</h3>${value}</article>`;
  }).join('');
}
function renderSecondaryCards(results = null) {
  $('#secondary-cards').innerHTML = secondary.map(([name, symbol, unit], index) => {
    const key = secondaryKeys[index];
    const isComplex = key === 'Z0' || key === 'gamma';
    const extras = results ? secondaryExtras(key, results) : [];
    const value = results
      ? `<p class="metric-value${isComplex ? ' metric-complex' : ''}" data-secondary-value="${key}">${secondaryValue(key, results, true)}</p>${extras.length ? `<div class="metric-auxiliary">${extras.map(text => `<span>${text}</span>`).join('')}</div>` : ''}`
      : '<span class="pending">Pendiente de cálculo</span>';
    return `<article class="metric"><div class="metric-top"><span class="metric-symbol">${symbol}</span><span class="metric-unit">${unit}</span></div><h3>${name}</h3>${value}</article>`;
  }).join('');
}
function renderTable() {
  $('#results-table').innerHTML = [...primary, ...secondary].map(([name, symbol, unit], index) => {
    let value = 'Pendiente de cálculo';
    if (lastResults) {
      if (index < primary.length) value = formatNumber(lastResults[primaryKeys[index]]);
      else {
        const key = secondaryKeys[index - primary.length];
        value = secondaryValue(key, lastResults.secondary);
        const extras = secondaryExtras(key, lastResults.secondary);
        if (extras.length) value += `<small class="table-auxiliary">${extras.join(' · ')}</small>`;
      }
    }
    return `<tr><th scope="row">${name}</th><td>${symbol}</td><td>${unit}</td><td>${value}</td></tr>`;
  }).join('');
}
function invalidateResults() {
  lastResults = null;
  renderCards('#primary-cards', primary);
  renderSecondaryCards();
  renderTable();
  $('#skin-diagnostics').hidden = true;
  $('#skin-diagnostics').textContent = '';
  $('#model-warnings').hidden = true;
  $('#model-warnings').textContent = '';
}
function showResults(results) {
  lastResults = results;
  renderCards('#primary-cards', primary, results);
  renderSecondaryCards(results.secondary);
  renderTable();
  $('#skin-diagnostics').innerHTML = `<span>Profundidad de penetración δ = <strong>${formatNumber(results.skinDepth)} m</strong></span><span>Resistencia superficial Rs = <strong>${formatNumber(results.surfaceResistance)} Ω/□</strong></span>`;
  $('#skin-diagnostics').hidden = false;
  $('#model-warnings').innerHTML = results.warnings.length
    ? `<p>Avisos del modelo (${results.warnings.length})</p><ul>${results.warnings.map(item => `<li>${item.message}</li>`).join('')}</ul>` : '';
  $('#model-warnings').hidden = !results.warnings.length;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  clearErrors();
  invalidateResults();
  try {
    const primaryResults = engine.calculatePrimary(readConfiguration());
    const results = { ...primaryResults, secondary: secondaryEngine.calculateSecondary(primaryResults) };
    showResults(results);
    const message = results.warnings.length
      ? `Parámetros primarios y secundarios calculados con ${results.warnings.length} aviso(s). Revisa las condiciones del modelo.`
      : 'Parámetros primarios y secundarios calculados. R′ es una aproximación de alta frecuencia.';
    status(message, results.warnings.length ? 'warning' : 'success');
  } catch (error) {
    if (error instanceof engine.ValidationError) {
      for (const [key, message] of Object.entries(error.issues)) {
        const input = key === 'frequencyUnit' ? $('#frequency-unit') : $(`#${key}`);
        const errorNode = key === 'frequencyUnit' ? $('#frequency-error') : $(`#${key}-error`);
        if (input) input.setAttribute('aria-invalid', 'true');
        if (errorNode) errorNode.textContent = message;
      }
      status('Revisa los campos señalados para continuar.', 'invalid');
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    } else {
      status(error instanceof RangeError ? error.message : 'No se pudo completar el cálculo. Revisa los datos y vuelve a intentarlo.', 'invalid');
    }
  }
});
['input', 'change'].forEach(type => form.addEventListener(type, event => {
  if (event.type === 'change' && event.target.id === 'conductor') loadConductor();
  if (event.type === 'change' && event.target.id === 'dielectric') loadDielectric();
  clearErrors();
  invalidateResults();
  status('Configuración modificada. Pulsa Calcular para actualizar los resultados.');
}));
form.addEventListener('reset', () => setTimeout(() => {
  // El navegador restaura primero los campos estáticos del formulario.
  loadConductor();
  loadDielectric();
  changeGeometry('bifilar');
  activateTab(0);
  status('Se ha restablecido la configuración inicial.');
}, 0));
document.querySelectorAll('.line-option').forEach(button => {
  button.addEventListener('click', () => changeGeometry(button.dataset.type));
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
function activateTab(index) {
  tabs.forEach((tab, position) => {
    const active = position === index;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(index));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); activateTab(next); tabs[next].focus(); }
  });
});

// Lectura compartida: el análisis reutiliza la configuración y el formato existentes.
globalThis.LineaLabUI = Object.freeze({ readConfiguration, formatNumber });
loadConductor();
loadDielectric();
changeGeometry('bifilar');
})();
