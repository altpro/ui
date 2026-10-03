// Deliberately session-only: this is a specification review demo, not a catalogue API.
const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const range = { name: 'Paracetamol 500mg Tablets', listed: true, vat: 'Standard rated', carousel: false, restricted: true, sets: ['ack', 'use'] };
const base = { priceStart: '2026-09-01', branch: null, tier: null, future: null, futureDate: '', supplier: '', cost: null, costStart: '', costEnd: '', sellable: true, category: '', schedule: '', hazard: '', strength: 500, form: 'Tablet', route: 'Oral', warnings: '', gtin: '', gtinLength: 0, nonphysical: false, handling: '', feed: false, feedCategory: '', feedDescription: '', composite: null };
let variants = [
  { ...base, id: 1, size: 16, code: 'PARA-016', plu: '421801', classification: 'GSL', contribution: 16, max: 6, web: 0.65, rrp: 1.09 },
  { ...base, id: 2, size: 32, code: 'PARA-032', plu: '421802', classification: 'P', contribution: 32, max: 3, web: 1.25, rrp: 1.99, branch: 1.49, tier: 1.15, future: 1.35, futureDate: '2026-10-01', supplier: 'Example wholesaler', cost: 0.72, costStart: '2026-09-01' },
  { ...base, id: 3, size: 96, code: 'PARA-096', plu: '421803', classification: 'P', contribution: 96, max: 1, web: 3.49, rrp: 5.97, composite: { id: 2, quantity: 3 } },
];
let editingId = null;
const logs = [
  { title: 'Attached Paracetamol Restriction to this Product', detail: 'Membership: not attached → attached. All three Variants contribute.', actor: 'Alex Morgan · Pharmacist', time: '2026-09-16T09:42:00', context: 'Non-effervescent tablets included in the range.' },
  { title: 'Created the 96-tablet composite', detail: 'Composition: none → 3 × PARA-032. Contribution derived: 96 tablets.', actor: 'Alex Morgan · Pharmacist', time: '2026-09-15T14:20:00', context: 'Added a larger pack option.' },
];
const sets = {
  ack: { title: 'Medicine acknowledgement', count: 1, description: 'One shared Acknowledgement Question.', eligibility: 'Permit when acknowledged; otherwise refuse. Bar — no telephone override.', questions: [{ id: 'Q-001', version: 3, type: 'Acknowledgement', text: 'I have read the patient information supplied with this medicine.' }] },
  use: { title: 'Intended use', count: 2, description: 'Capture what the medicine is being purchased for.', eligibility: 'No additional eligibility condition in this illustrative Set. All shown Questions require an Answer.', questions: [{ id: 'Q-014', version: 2, type: 'Free Text', text: 'What are you buying this medicine to treat?' }, { id: 'Q-015', version: 1, type: 'Yes / No', text: 'Have you used this medicine before?' }] },
};
const contribution = (v) => v.composite ? contribution(variants.find((p) => p.id === v.composite.id)) * v.composite.quantity : v.contribution;
const packName = (v) => `${v.size} tablets`;
const badge = (text, color = '') => `<span class="badge ${color} sm">${escape(text)}</span>`;
function toast(message) {
  const el = document.createElement('div');
  el.className = 'alert success';
  const p = document.createElement('p'); p.textContent = message; el.append(p);
  el.addEventListener('animationend', (e) => { if (e.animationName === 'toast-life') el.remove(); });
  $('toaster').append(el);
}
function record(title, detail, context) {
  logs.unshift({ title, detail, context, actor: 'Alex Morgan · Pharmacist', time: new Date().toISOString() });
}
function render() {
  $('product-name').textContent = range.name;
  document.title = `${range.name} · Weldricks`;
  const sellable = variants.filter((v) => v.sellable).length;
  const visible = range.listed && sellable > 0;
  $('visibility').textContent = visible ? 'Visible' : 'Not visible';
  $('visibility').className = `badge ${visible ? 'success' : ''} sm`;
  $('listing-summary').textContent = `${range.listed ? 'Listed' : 'Unlisted'} · ${sellable} sellable variant${sellable === 1 ? '' : 's'}`;
  $('buying-summary').textContent = `${range.restricted ? 'Sign-in & identity verification' : 'No restriction-based identity requirement'} · ${range.sets.length ? 'questions required' : 'no house questions'}`;
  $('vat-summary').textContent = range.vat;
  $('carousel-summary').textContent = range.carousel ? 'Hidden' : 'Included';
  $('variant-count').textContent = variants.length;
  const needle = $('variant-search').value.toLowerCase().trim();
  const matches = variants.filter((v) => `${packName(v)} ${v.code} ${v.plu}`.toLowerCase().includes(needle));
  $('variant-rows').innerHTML = matches.map((v) => `<tr><th scope="row"><div class="flex items-center gap-3"><span class="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-base tabular-nums" aria-hidden="true">${v.size}</span><div><p class="font-semibold">${packName(v)}</p><p class="mt-1 text-xs font-normal muted">${escape(v.code)}${v.composite ? ' · Composite' : ''}</p></div></div></th><td>${badge(v.classification, 'outlined')}</td><td class="tabular-nums"><p>${money(v.web)}</p><p class="text-xs muted">${money(v.web / v.size)} / item</p></td><td>${badge(v.sellable ? 'Sellable' : 'Not sellable', v.sellable ? 'success' : '')}</td><td><button class="btn ghost sm" data-edit="${v.id}" aria-label="Edit ${packName(v)}">Open →</button></td></tr>`).join('');
  $('search-empty').hidden = matches.length > 0;
  $('contribution-rows').innerHTML = variants.map((v) => `<tr><th scope="row">${packName(v)}</th><td class="text-right font-mono">${contribution(v)} tablets</td><td class="muted">${v.composite ? `Derived · ${v.composite.quantity} × ${escape(variants.find((p) => p.id === v.composite.id).code)}` : 'Entered per pack'}</td></tr>`).join('');
  $('quantity-caps').innerHTML = variants.map((v) => `<div><dt>${packName(v)}</dt><dd class="font-medium">${v.max ? `${v.max} pack${v.max === 1 ? '' : 's'}` : 'No cap'}</dd></div>`).join('');
  $('restriction-card').hidden = !range.restricted;
  $('no-restriction').hidden = range.restricted;
  $('question-set-cards').innerHTML = range.sets.map((id) => {
    const s = sets[id];
    return `<section class="card divided"><header><hgroup><h3>${s.title}</h3><p>${s.description}</p></hgroup>${badge('Weldricks chose it')}</header><div class="flex flex-wrap items-center gap-3 text-sm"><span class="font-mono">${s.count} Question${s.count === 1 ? '' : 's'}</span><span class="muted">Attached to this Product · shared library</span></div><div class="rounded-md bg-muted p-4 text-sm"><p class="font-semibold">Eligibility</p><p class="mt-1">${s.eligibility}</p></div><footer><button class="btn outlined sm" data-preview="${id}">Preview Questions</button><span class="text-xs muted">Illustrative wording for review</span></footer></section>`;
  }).join('') || '<div class="alert"><p>No house Question Sets attached. Use Manage Question Sets to choose one.</p></div>';
  if (variants.some((v) => ['POM-V', 'POM-VPS', 'NFA-VPS'].includes(v.classification))) {
    $('question-set-cards').insertAdjacentHTML('beforeend', '<section class="card"><header><h2>Veterinary statutory Question Set</h2><span class="badge info sm">Automatic · cannot detach</span></header><p class="text-sm">Required by the classification of a Variant in this range. The veterinary instrument is not configured in this demo; affected Variants cannot be made sellable here.</p></section>');
  }
  $('activity').innerHTML = logs.map((log) => `<li><p><b>${escape(log.title)}</b></p><p class="mt-1 text-sm">${escape(log.detail)}</p><p class="mt-2 text-sm muted">${escape(log.context)}</p><p class="mt-2 text-xs">${escape(log.actor)}</p><time datetime="${log.time}">${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.time))}</time></li>`).join('');
  // Keep the shell's product link and breadcrumb in step with a range rename.
  document.querySelectorAll('#sidebar a[aria-current="page"], header .breadcrumb [aria-current="page"]').forEach((el) => el.textContent = range.name);
}
function open(id) { $(id).showModal(); }
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
  const edit = e.target.closest('[data-edit]'); if (edit) editVariant(Number(edit.dataset.edit));
  const preview = e.target.closest('[data-preview]');
  if (preview) {
    const s = sets[preview.dataset.preview];
    $('preview-title').textContent = s.title;
    $('preview-content').innerHTML = `<p class="text-sm muted">Read-only preview · no Assessment or Answers are created.</p>${s.questions.map((q) => `<section class="rounded-md border border-border p-4"><p class="text-xs muted font-mono">${q.id} · wording v${q.version} · ${q.type}</p><h3 class="mt-3 font-medium">${q.text}</h3><p class="mt-2 text-xs muted">Required${q.type === 'Acknowledgement' || q.type === 'Free Text' ? ' · does not form a series' : ' · forms an Answer History'}</p></section>`).join('')}<p class="text-sm"><b>Eligibility:</b> ${s.eligibility}</p>`;
    open('preview-dialog');
  }
});
$('variant-search').addEventListener('input', render);
$('edit-range').onclick = () => {
  $('range-name').value = range.name; $('range-listed').checked = range.listed; $('range-vat').value = range.vat; $('range-carousel').checked = range.carousel; open('range-dialog');
};
$('range-form').onsubmit = (e) => {
  e.preventDefault();
  const next = { name: $('range-name').value.trim(), listed: $('range-listed').checked, vat: $('range-vat').value, carousel: $('range-carousel').checked };
  if (!next.name) { $('range-name').setCustomValidity('Enter a product name.'); $('range-name').reportValidity(); return; }
  const changes = Object.entries(next).filter(([key, value]) => range[key] !== value).map(([key, value]) => `${key}: ${range[key]} → ${value}`);
  Object.assign(range, next);
  if (changes.length) record('Updated product range', changes.join('; '), 'Range details edited.');
  $('range-dialog').close(); render(); toast(changes.length ? 'Range saved for this demo session.' : 'No changes to save.');
};
$('range-name').oninput = () => $('range-name').setCustomValidity('');
$('view-page').onclick = () => {
  $('preview-title').textContent = 'Linked page · version 4';
  $('preview-content').innerHTML = '<p class="text-sm muted">Page 218 · published version · illustrative content</p><h3 class="text-2xl font-semibold">Paracetamol tablets</h3><dl class="dl"><div><dt>Heading</dt><dd>Paracetamol tablets</dd></div><div><dt>Path</dt><dd class="break-all font-mono">/products/paracetamol-tablets</dd></div><div><dt>Search indexing</dt><dd>Allowed</dd></div></dl><p class="text-sm muted">Description, clinical copy, search metadata and redirects are managed by the page editor. No clinical copy has been supplied for this prototype.</p>';
  open('preview-dialog');
};
$('manage-restrictions').onclick = () => { $('paracetamol-attached').checked = range.restricted; $('membership-context').value = ''; open('membership-dialog'); };
$('membership-form').onsubmit = (e) => {
  e.preventDefault();
  const next = $('paracetamol-attached').checked;
  if (next !== range.restricted) record('Changed Paracetamol membership on this Product', `Membership: ${range.restricted ? 'attached' : 'not attached'} → ${next ? 'attached' : 'not attached'}. Statutory Ceiling unchanged.`, $('membership-context').value);
  range.restricted = next; $('membership-dialog').close(); render(); toast('Restriction membership saved for this demo session.');
};
$('manage-sets').onclick = () => { ['ack', 'use'].forEach((id) => $(`set-${id}`).checked = range.sets.includes(id)); $('sets-context').value = ''; open('sets-dialog'); };
$('sets-form').onsubmit = (e) => {
  e.preventDefault(); const next = ['ack', 'use'].filter((id) => $(`set-${id}`).checked);
  if (next.join() !== range.sets.join()) record('Changed Question Set membership', `${range.sets.map((id) => sets[id].title).join(', ') || 'None'} → ${next.map((id) => sets[id].title).join(', ') || 'None'}`, $('sets-context').value);
  range.sets = next; $('sets-dialog').close(); render(); toast('Question Sets saved for this demo session.');
};
const fields = { 'pack-branch': 'branch', 'pack-tier': 'tier', 'pack-future': 'future', 'pack-future-date': 'futureDate', 'pack-supplier': 'supplier', 'pack-cost': 'cost', 'pack-cost-start': 'costStart', 'pack-cost-end': 'costEnd', 'pack-size': 'size', 'pack-code': 'code', 'pack-plu': 'plu', 'pack-class': 'classification', 'pack-category': 'category', 'pack-schedule': 'schedule', 'pack-hazard': 'hazard', 'drug-strength': 'strength', 'drug-form': 'form', 'drug-route': 'route', 'drug-warnings': 'warnings', 'pack-contribution': 'contribution', 'pack-max': 'max', 'pack-web': 'web', 'pack-rrp': 'rrp', 'pack-handling': 'handling', 'feed-category': 'feedCategory', 'feed-description': 'feedDescription' };
function editVariant(id = null) {
  editingId = id;
  const v = variants.find((item) => item.id === id) || { ...base, size: '', code: '', plu: '', classification: 'P', strength: 500, form: 'Tablet', route: 'Oral', contribution: '', max: '', web: '', rrp: '' };
  $('variant-form').reset(); $('variant-error').textContent = '';
  $('variant-title').textContent = id ? `${packName(v)} · ${v.code}` : 'Add a Variant';
  Object.entries(fields).forEach(([key, prop]) => $(key).value = v[prop] ?? '');
  $('pack-gtin').value = v.gtin ? v.gtin.slice(-v.gtinLength) : '';
  for (const [key, prop] of [['pack-sellable', 'sellable'], ['pack-nonphysical', 'nonphysical'], ['pack-feed', 'feed']]) $(key).checked = v[prop];
  $('pack-composite').checked = !!v.composite;
  $('part-variant').innerHTML = variants.filter((p) => p.id !== id && !p.composite).map((p) => `<option value="${p.id}">${packName(p)} · ${escape(p.code)}</option>`).join('');
  if (v.composite) { $('part-variant').value = v.composite.id; $('part-quantity').value = v.composite.quantity; }
  $('price-records').innerHTML = `<div class="rounded-md border border-border p-3 text-sm"><p class="font-medium">Web · 1+ pack${id ? ` · ${money(v.web)}` : ''}</p><p class="mt-1 muted">${escape(id ? v.priceStart : '2026-09-16')} → ${escape(v.futureDate || 'no end date')}</p>${v.future ? `<p class="mt-2">Scheduled · ${money(v.future)} from ${escape(v.futureDate)}</p>` : ''}<p class="mt-2 text-xs muted">Edit the channel prices, tier and next period below. Dates are inclusive at the start, exclusive at the end.</p></div>`;
  updateVariantFields(); open('variant-dialog');
}
function updateVariantFields() {
  const classification = $('pack-class').value, medicine = classification !== 'Not A Medicine';
  $('pack-category').disabled = medicine; $('pack-schedule').disabled = !medicine;
  $('drug-fields').hidden = !medicine;
  $('drug-fields').querySelectorAll('input, textarea').forEach((el) => el.disabled = !medicine);
  const floor = ['POM', 'POM-V', 'POM-VPS', 'NFA-VPS'].includes(classification) ? 'Pharmacist' : classification === 'P' ? 'Technician' : 'No classification-based requirement';
  $('class-summary').textContent = `Derived competence floor: ${floor}.${$('pack-schedule').value || $('pack-hazard').value ? ' Schedule or hazard can raise this floor; the applicable staffing mapping must be configured.' : ''} Customer wording is governed centrally for this class.`;
  const composite = $('pack-composite').checked;
  $('composite-fields').hidden = !composite;
  $('pack-contribution').readOnly = composite;
  $('pack-size').readOnly = composite;
  $('contribution-hint').textContent = composite ? 'Derived from the component Contribution × quantity. Not entered by hand.' : 'Per Variant purchased. Governed separately from pack size.';
  if (composite) {
    const part = variants.find((v) => v.id === Number($('part-variant').value));
    if (part) { $('pack-size').value = part.size * Number($('part-quantity').value); $('pack-contribution').value = contribution(part) * Number($('part-quantity').value); }
  }
  $('handling-fields').hidden = $('pack-nonphysical').checked;
  $('pack-handling').disabled = $('pack-nonphysical').checked;
  $('feed-fields').hidden = !$('pack-feed').checked;
  $('feed-fields').querySelectorAll('input, textarea').forEach((el) => el.disabled = !$('pack-feed').checked);
}
['pack-class', 'pack-schedule', 'pack-hazard', 'pack-composite', 'part-variant', 'part-quantity', 'pack-nonphysical', 'pack-feed'].forEach((id) => $(id).addEventListener('input', updateVariantFields));
$('add-variant').onclick = () => editVariant();
// Reveal invalid controls inside collapsed sections before native validation focuses them.
$('variant-form').addEventListener('invalid', (event) => {
  const section = event.target.closest('details');
  if (section) section.open = true;
}, true);
function validGTIN(value) {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  const digits = [...value].map(Number); const check = digits.pop();
  const sum = digits.reverse().reduce((total, n, i) => total + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - sum % 10) % 10 === check;
}
$('variant-form').onsubmit = (e) => {
  e.preventDefault();
  const old = variants.find((v) => v.id === editingId);
  const next = { ...(old || base), id: editingId ?? Math.max(...variants.map((v) => v.id)) + 1 };
  Object.entries(fields).forEach(([key, prop]) => next[prop] = $(key).value.trim());
  ['size', 'strength', 'contribution', 'web'].forEach((key) => next[key] = Number(next[key]));
  ['max', 'rrp', 'branch', 'tier', 'future', 'cost'].forEach((key) => next[key] = next[key] === '' ? null : Number(next[key]));
  if (!old) next.priceStart = '2026-09-16';
  next.sellable = $('pack-sellable').checked; next.nonphysical = $('pack-nonphysical').checked; next.feed = $('pack-feed').checked;
  const gtin = $('pack-gtin').value.trim();
  const fail = (message) => { $('variant-error').textContent = message; $('variant-error').scrollIntoView({ block: 'nearest' }); };
  if ((next.future !== null) !== Boolean(next.futureDate)) return fail('Enter both a next web price and its start date, or leave both blank.');
  if (next.futureDate && next.futureDate <= '2026-09-16') return fail('The next Price must start after the demo date, 16 September 2026.');
  if ((next.cost !== null || next.supplier || next.costStart || next.costEnd) && (next.cost === null || !next.supplier || !next.costStart)) return fail('A supplier Cost needs a supplier, amount and start date.');
  if (next.costEnd && next.costEnd <= next.costStart) return fail('The Cost end date must follow its start date.');
  if (!next.code) return fail('Enter a staff code.');
  if (variants.some((v) => v.id !== next.id && v.code.toLowerCase() === next.code.toLowerCase())) return fail('That staff code is already used by another Variant.');
  if (variants.some((v) => v.id !== next.id && v.size === next.size)) return fail('A Variant with this size already exists. Choose a distinct size.');
  if (gtin && !validGTIN(gtin)) return fail('Enter a GTIN with 8, 12, 13 or 14 digits and a valid GS1 check digit.');
  if (next.classification !== 'Not A Medicine' && (next.strength !== 500 || next.form !== 'Tablet' || next.route !== 'Oral')) return fail('This range varies by Size only. Its medicine Variants must remain 500mg oral tablets. A different strength or form needs a different range or a declared axis.');
  if (next.sellable && !['GSL', 'P'].includes(next.classification)) return fail('This sample range is configured only for GSL or P. Turn off Sellable to save an unconfigured classification for review.');
  if (next.nonphysical) next.handling = '';
  if (next.sellable && (next.schedule || next.hazard || next.handling)) return fail('No staffing or delivery mapping is configured for this schedule, hazard or handling requirement. Turn off Sellable before saving.');
  if (next.feed && !gtin) return fail('Enter a valid GTIN before enabling this example feed membership.');
  next.gtin = gtin ? gtin.padStart(14, '0') : ''; next.gtinLength = gtin.length;
  if (next.classification === 'Not A Medicine') { next.schedule = ''; next.strength = null; next.form = ''; next.route = ''; next.warnings = ''; } else next.category = '';
  if (next.nonphysical) next.handling = '';
  if (!next.feed) { next.feedCategory = ''; next.feedDescription = ''; }
  next.composite = $('pack-composite').checked ? { id: Number($('part-variant').value), quantity: Number($('part-quantity').value) } : null;
  if (next.composite && (!Number.isInteger(next.composite.quantity) || next.composite.quantity < 1)) return fail('Enter a whole component quantity of at least 1.');
  if (!Number.isInteger(next.size) || next.size < 1 || !Number.isInteger(next.contribution) || next.contribution < 1) return fail('Size and Contribution must be positive whole numbers.');
  const proposed = variants.map((v) => v.id === next.id ? next : v);
  // A component size change also changes its composites. Keep the size axis unique.
  for (const v of proposed) {
    if (v.composite?.id === next.id) {
      if (next.composite) return fail('This Variant is already used as a component. Nested compositions are not supported in this demo.');
      const derivedSize = next.size * v.composite.quantity;
      if (proposed.some((p) => p.id !== v.id && p.size === derivedSize)) return fail('This component size would give its composite the same size as another Variant.');
    }
  }
  const changes = Object.keys(next).filter((key) => key !== 'id' && JSON.stringify(old?.[key]) !== JSON.stringify(next[key])).map((key) => `${key}: ${JSON.stringify(old?.[key] ?? 'not set')} → ${JSON.stringify(next[key])}`);
  if (old) variants = proposed; else variants.push(next);
  for (const v of variants) if (v.composite?.id === next.id) { v.size = next.size * v.composite.quantity; v.contribution = contribution(v); }
  if (changes.length) record(old ? `Updated ${packName(next)}` : `Added ${packName(next)}`, changes.join('; '), $('pack-reason').value);
  $('variant-dialog').close(); render(); toast(changes.length ? 'Variant saved for this demo session.' : 'No changes to save.');
};
render();
