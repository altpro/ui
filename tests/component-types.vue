<!--
  Type test for apps: vue-tsc checks these usages as an app's TypeScript would see them, so a component whose
  inferred prop types are narrower than its docs fails test:unit here. Never rendered.
  @vue-expect-error marks what must stay an error.
-->
<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "@inertiajs/vue3";
import ConfirmDialog from "../resources/js/ConfirmDialog.vue";
import DataList from "../resources/js/DataList.vue";
import DataTimeline from "../resources/js/DataTimeline.vue";
import FileInput from "../resources/js/FileInput.vue";
import { useDataList, type DataTableFilter } from "../resources/js/dataTable";
import { leaveWithoutAsking, useUnsavedChanges } from "../resources/js/useUnsavedChanges";

const one = ref<File | null>(null);
const many = ref<File[]>([]);

type Entry = { id: number; at: string; name: string; kind: string };
const entries: Entry[] = [];
const filters: DataTableFilter<Entry>[] = [{ key: "kind", label: "Kind", type: "select" }];
const list = useDataList<Entry>(() => ({ rows: entries, filters, name: "entries", sortOptions: [{ key: "at", direction: "desc", label: "Newest" }] }));
const name = (entry: Entry): string => entry.name;

const form = useForm({ name: "" });
useUnsavedChanges(form);
const { allowLeaving } = useUnsavedChanges(() => form.isDirty, "Leave without saving?");
allowLeaving();
leaveWithoutAsking();
// @ts-expect-error a form or a function, not a boolean
useUnsavedChanges(true);
const dialog = ref<InstanceType<typeof ConfirmDialog>>();
dialog.value?.close();
</script>

<template>
  <FileInput v-model="one" name="photo" />
  <FileInput v-model="many" name="photos" multiple />
  <!-- @vue-expect-error a string is not a file -->
  <FileInput model-value="photo.jpg" />

  <DataTimeline caption="Log" :rows="entries" date-key="at" :filters="filters" filter-display="drawer" filter-count="changed" :search="false" :entry-class="(row) => (row.kind === 'x' ? 'danger' : undefined)">
    <template #marker="{ row }">{{ name(row) }}</template>
    <template #entry="{ row }">{{ name(row) }}</template>
    <template #filter-kind="{ values, set }"><button @click="set([...values, 'a'])" /></template>
  </DataTimeline>
  <!-- @vue-expect-error not a field of the row -->
  <DataTimeline caption="Log" :rows="entries" date-key="nope" />
  <!-- @vue-expect-error not a way to show filters -->
  <DataTimeline caption="Log" :rows="entries" date-key="at" filter-display="modal" />
  <!-- @vue-expect-error not something the badge can count -->
  <DataTimeline caption="Log" :rows="entries" date-key="at" filter-count="some" />

  <DataList :list="list" caption="Entries" filter-display="drawer" v-slot="{ rows }">{{ rows.map(name) }}</DataList>

  <ConfirmDialog ref="dialog" id="delete" title="Delete?" confirm-label="Delete" tone="danger" :busy="form.processing" @confirm="form.delete('/x')" @close="form.reset()">
    <template #description>Gone <strong>for good</strong>.</template>
    <input name="password" />
  </ConfirmDialog>
  <ConfirmDialog id="send" title="Send?" description="It goes now." confirm-label="Send" cancel-label="Keep editing" />
  <!-- @vue-expect-error not a tone -->
  <ConfirmDialog id="x" title="X" confirm-label="X" tone="warning" />
  <!-- @vue-expect-error confirm-label is required -->
  <ConfirmDialog id="x" title="X" />
</template>
