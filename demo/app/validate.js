// one inline voice for a form's errors: the fields' own constraints, read before the browser's bubbles can show.
// The form takes novalidate; a failed field keeps its message until it's typed in, and the first one takes focus.
const label = (form, el) => (form.querySelector(`label[for="${el.id}"]`)?.textContent ?? el.getAttribute('aria-label') ?? 'a value').replace('(optional)', '').trim();
const lower = text => /^[A-Z]{2}/.test(text) ? text : text[0].toLowerCase() + text.slice(1);
// a required field of spaces is as empty as a blank one
const blank = el => el.required && !el.value.trim();
function message(form, el) {
  if (el.validity.badInput) return 'Enter a number.';
  if (/in stock$/i.test(label(form, el)) && el.validity.valueMissing) return 'Enter how many are in stock.';
  if (/\.price$/.test(el.name) && el.validity.valueMissing) return 'Enter the price.';
  if (el.validity.valueMissing || blank(el)) return `Enter the ${lower(label(form, el))}.`;
  if (el.validity.rangeUnderflow) return 'Enter 0 or more.';
  if (el.validity.stepMismatch) return el.step === '1' ? 'Enter a whole number.' : 'Enter pounds and pence.';
  return el.validationMessage;
}
export function fieldErrors(form) {
  const invalid = [...form.elements].filter(el => el.name && (!el.checkValidity() || blank(el)));
  invalid[0]?.focus();
  return Object.fromEntries(invalid.map(el => [el.name, message(form, el)]));
}
// a corrected field loses its message: the bag without this field's entry
export const withoutField = (bag, event) => Object.fromEntries(Object.entries(bag).filter(([name]) => name !== event.target.name));
