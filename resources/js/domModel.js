// For a component used without v-model inside a form that owns its data
// (Inertia's <Form>, or a plain <form> with a reset button). Vue keeps its own
// copy of the value then, but Inertia's reset() and a native reset write
// straight to the inputs, and on the next render v-model would put the old
// value back. So read the inputs into the model before every render, and on
// the form's reset event. With v-model the model is the truth: nothing to do.
// A reset('field') of one field fires no event: the inputs are right at once,
// and so is a multiselect's button (multiselect.js sees the boxes change), but
// the model here catches up on the next render. Nothing reads it before then.
import { getCurrentInstance, onBeforeUnmount, onBeforeUpdate, onMounted } from "vue";

export function useDomModel(model, root, read) {
  const instance = getCurrentInstance();
  const sync = () => {
    if (root.value && !("onUpdate:modelValue" in (instance.vnode.props ?? {}))) model.value = read(root.value);
  };
  // Inertia fires reset after writing the inputs, the browser before, so wait either way
  const later = () => setTimeout(sync);
  let form;
  onBeforeUpdate(sync);
  onMounted(() => (form = root.value.querySelector("input, select, textarea")?.form)?.addEventListener("reset", later));
  onBeforeUnmount(() => form?.removeEventListener("reset", later));
}
