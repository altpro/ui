// one inline voice for a form's errors: the fields' own constraints, read before the browser's bubbles can show.
// The form takes novalidate; a failed field keeps its message until it's typed in, and the first one takes focus.
const label = (form, el) => (form.querySelector(`label[for="${el.id}"]`)?.textContent ?? el.getAttribute('aria-label') ?? 'a value').replace('(optional)', '').trim();
const lower = text => /^[A-Z]{2}/.test(text) ? text : text[0].toLowerCase() + text.slice(1);
function message(form, el) {
  if (el.validity.valueMissing) return `Enter the ${lower(label(form, el))}.`;
  if (el.validity.rangeUnderflow) return 'Enter 0 or more.';
  if (el.validity.stepMismatch) return el.step === '1' ? 'Enter a whole number.' : 'Enter pounds and pence.';
  return el.validationMessage;
}
export function fieldErrors(form) {
  const invalid = [...form.elements].filter(el => el.name && !el.checkValidity());
  invalid[0]?.focus();
  return Object.fromEntries(invalid.map(el => [el.name, message(form, el)]));
}
