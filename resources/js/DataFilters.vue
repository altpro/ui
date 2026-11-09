<!--
  The controls for a list's declared filters, drawn from values in and changes out, so the toolbar can bind them to the
  URL and the drawer to a draft. Renders with no wrapper: its fields are children of whatever holds it.
  Used by DataList.vue; a page has no reason to use it directly.
-->
<script setup lang="ts" generic="TRow extends object">
import { useId } from "vue";
import Combobox from "./Combobox.vue";
import { datePresets, filterIsSet, type DataTableFilter } from "./dataTable";

const props = defineProps<{
  filters: ReadonlyArray<DataTableFilter<TRow>>;
  values: Record<string, string[]>;
  /** Focus the first control when a dialog holding these opens. */
  focusFirst?: boolean;
}>();

const emit = defineEmits<{ change: [key: string, values: string[]] }>();

defineSlots<{
  [key: `filter-${string}`]: ((props: { filter: DataTableFilter<TRow>; values: string[]; set: (values: string[]) => void }) => unknown) | undefined;
}>();

const id = useId();
const valuesOf = (key: string) => props.values[key] ?? [];
const filterValue = (key: string) => valuesOf(key)[0] ?? "";
// both dates emptied is no range at all, and a filter that says nothing is an empty one
const set = (key: string, values: string[]) => emit("change", key, values.some((v) => v !== "") ? values : []);
// a preset is only a way to fill in the dates: the select names one while both dates still match it
const presetOf = (key: string) => {
  const [from, to] = valuesOf(key);
  return datePresets().find((p) => p.range[0] === from && p.range[1] === to)?.label ?? "";
};
const applyPreset = (key: string, label: string) => set(key, [...datePresets().find((p) => p.label === label)!.range]);
// clearing a range brings its default back, so a default leaves nothing to clear
const rangeClearable = (filter: DataTableFilter<TRow>) => filterIsSet(filter, valuesOf(filter.key));
const first = (index: number) => (props.focusFirst && index === 0) || undefined;
</script>

<template>
  <template v-for="(filter, index) in filters" :key="filter.key">
    <slot v-if="$slots[`filter-${filter.key}`]" :name="`filter-${filter.key}`" :filter="filter" :values="valuesOf(filter.key)" :set="(values: string[]) => set(filter.key, values)" />
    <div v-else-if="filter.type === 'select'" class="field">
      <label :for="`${id}-${filter.key}`">{{ filter.label }}</label>
      <select :id="`${id}-${filter.key}`" class="input" :value="filterValue(filter.key)" :autofocus="first(index)" @change="set(filter.key, [($event.target as HTMLSelectElement).value])">
        <option value="">All</option>
        <option v-for="o in filter.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <label v-else-if="filter.type === 'boolean'" class="checkbox">
      <input type="checkbox" :checked="filterValue(filter.key) === '1'" :autofocus="first(index)" @change="set(filter.key, ($event.target as HTMLInputElement).checked ? ['1'] : [])" />
      {{ filter.label }}
    </label>
    <fieldset v-else-if="filter.type === 'daterange'" class="field">
      <legend>{{ filter.label }}</legend>
      <select v-if="filter.presets" class="input" :aria-label="`${filter.label} preset`" :value="presetOf(filter.key)" :autofocus="first(index)" @change="applyPreset(filter.key, ($event.target as HTMLSelectElement).value)">
        <option value="" hidden>{{ valuesOf(filter.key).length ? "Custom" : "Any time" }}</option>
        <option v-for="p in datePresets()" :key="p.label">{{ p.label }}</option>
      </select>
      <div class="join">
        <input type="date" class="input" :aria-label="`${filter.label} from`" :value="filterValue(filter.key)" :autofocus="(!filter.presets && first(index)) || undefined" @change="set(filter.key, [($event.target as HTMLInputElement).value, valuesOf(filter.key)[1] ?? ''])" />
        <input type="date" class="input" :aria-label="`${filter.label} to`" :value="valuesOf(filter.key)[1] ?? ''" @change="set(filter.key, [filterValue(filter.key), ($event.target as HTMLInputElement).value])" />
        <!-- aria-disabled, as `disabled` would drop the focus of whoever just pressed it, and it stays in the join so the toolbar holds still -->
        <button type="button" class="btn outlined" :aria-label="filter.clearLabel ? undefined : `Clear ${filter.label}`" :aria-disabled="rangeClearable(filter) ? undefined : 'true'" @click="rangeClearable(filter) && set(filter.key, [])">{{ filter.clearLabel ?? "Clear" }}</button>
      </div>
    </fieldset>
    <div v-else class="field">
      <label>{{ filter.label }}</label>
      <Combobox multiple :label="filter.label" placeholder="All" :options="[...(filter.options ?? [])]" :model-value="valuesOf(filter.key)" :autofocus="first(index)" @update:model-value="set(filter.key, $event)" />
    </div>
  </template>
</template>
