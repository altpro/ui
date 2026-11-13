<!--
  The controls for a list's declared filters and its order, drawn from values in and changes out, so the toolbar can bind them to the
  URL and the drawer to a draft. Renders with no wrapper: its fields are children of whatever holds it.
  Used by DataList.vue; a page has no reason to use it directly.
-->
<script setup lang="ts" generic="TRow extends object">
import { ref, useId } from "vue";
import Combobox from "./Combobox.vue";
import { datePresets, filterIsSet, type DataListSortOption, type DataTableFilter } from "./dataTable";

const props = defineProps<{
  filters: ReadonlyArray<DataTableFilter<TRow>>;
  values: Record<string, string[]>;
  /** Focus the first control when a dialog holding these opens. */
  focusFirst?: boolean;
  sortOptions?: ReadonlyArray<DataListSortOption>;
  /** Which of `sortOptions` is chosen, by index; "-1" for an order none of them is. */
  sort?: string;
  sortLabel?: string;
}>();

const emit = defineEmits<{ change: [key: string, values: string[]]; sort: [index: string] }>();

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

// Chrome commits a date field at every digit, so a year being typed arrives as 0002, 0020, 0202: wait for all four
const wholeYear = (date: string) => date === "" || /^[1-9]\d{3}-/.test(date);
// While the reader is in one of a range's dates, both show what they typed. The list turns a reversed range round, and
// doing that under the cursor would scramble a date half edited; leaving the field shows the range as the list reads it.
const typing = ref<{ key: string; range: string[] } | null>(null);
const rangeOf = (key: string) => (typing.value?.key === key ? typing.value.range : [valuesOf(key)[0] ?? "", valuesOf(key)[1] ?? ""]);
const setEnd = (key: string, end: 0 | 1, value: string) => {
  if (!wholeYear(value)) return;
  const range = [...rangeOf(key)];
  range[end] = value;
  typing.value = { key, range };
  set(key, range);
};
// a year left half typed was never sent, so the field goes back to the date the list holds
const leaveEnd = (key: string, end: 0 | 1, input: HTMLInputElement) => {
  typing.value = null;
  input.value = rangeOf(key)[end]!;
};
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
        <input type="date" class="input" :aria-label="`${filter.label} from`" :value="rangeOf(filter.key)[0]" :autofocus="(!filter.presets && first(index)) || undefined" @change="setEnd(filter.key, 0, ($event.target as HTMLInputElement).value)" @blur="leaveEnd(filter.key, 0, $event.target as HTMLInputElement)" />
        <input type="date" class="input" :aria-label="`${filter.label} to`" :value="rangeOf(filter.key)[1]" @change="setEnd(filter.key, 1, ($event.target as HTMLInputElement).value)" @blur="leaveEnd(filter.key, 1, $event.target as HTMLInputElement)" />
        <!-- aria-disabled, as `disabled` would drop the focus of whoever just pressed it, and it stays in the join so the toolbar holds still -->
        <button type="button" class="btn outlined" :aria-label="filter.clearLabel ? undefined : `Clear ${filter.label}`" :aria-disabled="rangeClearable(filter) ? undefined : 'true'" @click="rangeClearable(filter) && set(filter.key, [])">{{ filter.clearLabel ?? "Clear" }}</button>
      </div>
    </fieldset>
    <div v-else class="field">
      <label>{{ filter.label }}</label>
      <Combobox multiple :label="filter.label" placeholder="All" :options="[...(filter.options ?? [])]" :model-value="valuesOf(filter.key)" :autofocus="first(index)" @update:model-value="set(filter.key, $event)" />
    </div>
  </template>

  <div v-if="sortOptions?.length" class="field">
    <label :for="`${id}-sort`">{{ sortLabel ?? "Sort" }}</label>
    <select :id="`${id}-sort`" class="input" :value="sort" @change="emit('sort', ($event.target as HTMLSelectElement).value)">
      <!-- a link can ask for a direction this list does not offer -->
      <option v-if="sort === '-1'" value="-1" hidden>Custom</option>
      <option v-for="(option, index) in sortOptions" :key="index" :value="String(index)">{{ option.label }}</option>
    </select>
  </div>
</template>
