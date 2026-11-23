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
import DataTable from "../resources/js/DataTable.vue";
import DataTimeline from "../resources/js/DataTimeline.vue";
import EmailAddress from "../resources/js/EmailAddress.vue";
import FileInput from "../resources/js/FileInput.vue";
import ListHeader from "../resources/js/ListHeader.vue";
import type { ListHeaderStat } from "../resources/js/ListHeader.vue";
import LocalDate from "../resources/js/LocalDate.vue";
import PageBreadcrumb from "../resources/js/PageBreadcrumb.vue";
import PageHeading from "../resources/js/PageHeading.vue";
import StatLink from "../resources/js/StatLink.vue";
import UserAvatar from "../resources/js/UserAvatar.vue";
import { avatarHue, getInitials, type AvatarHue } from "../resources/js/avatar";
import { useSaveStatus } from "../resources/js/useSaveStatus";
import { useToday } from "../resources/js/useToday";
import { useDataList, type DataTableColumn, type DataTableFilter } from "../resources/js/dataTable";
import { leaveWithoutAsking, useUnsavedChanges } from "../resources/js/useUnsavedChanges";

const one = ref<File | null>(null);
const many = ref<File[]>([]);

type Entry = { id: number; at: string; name: string; kind: string };
const entries: Entry[] = [];
const filters: DataTableFilter<Entry>[] = [{ key: "kind", label: "Kind", type: "select" }];
const list = useDataList<Entry>(() => ({ rows: entries, filters, name: "entries", sortOptions: [{ key: "at", direction: "desc", label: "Newest" }] }));
const name = (entry: Entry): string => entry.name;
const columns: DataTableColumn<Entry>[] = [{ key: "name", label: "Name", sortable: true }];
const link: { href: string; onClick: (event: MouseEvent) => void } = list.filterLink("kind", ["a"]);
const narrowed: boolean = list.narrowed.value;
const href: string = list.state.href({ filters: { kind: [] } });

const form = useForm({ name: "" });
useUnsavedChanges(form);
const { allowLeaving } = useUnsavedChanges(() => form.isDirty, "Leave without saving?");
useUnsavedChanges(form, { message: "Leave without saving the order?", remember: "order" });
useUnsavedChanges(form, { remember: false });
allowLeaving();
leaveWithoutAsking();
// @ts-expect-error a form or a function, not a boolean
useUnsavedChanges(true);
const dialog = ref<InstanceType<typeof ConfirmDialog>>();
dialog.value?.close();

const { saveStatus, noteNothingToSave } = useSaveStatus(form);
const status: string = saveStatus.value;
noteNothingToSave();
noteNothingToSave("No changes to publish.");
const publishing = useSaveStatus(form, { saved: () => "Published." });
const published: string = publishing.saveStatus.value;
const today: string = useToday().value;
const hue: AvatarHue = avatarHue("Sam Taylor");
const initials: string = getInitials("Sam Taylor");
const icon = { render: () => null };
const stats: ListHeaderStat[] = [{ value: "a", count: 2, icon, hue: "green" }, { value: "b", label: "Bee", count: 0 }];
</script>

<template>
  <FileInput v-model="one" name="photo" />
  <FileInput v-model="many" name="photos" multiple />
  <!-- @vue-expect-error a string is not a file -->
  <FileInput model-value="photo.jpg" />

  <DataTimeline caption="Log" :rows="entries" date-key="at" :filters="filters" filter-display="drawer" filter-count="changed" :search="false" :private-search="true" :entry-class="(row) => (row.kind === 'x' ? 'danger' : undefined)">
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

  <DataTable caption="Entries" class="framed" table-class="table-fixed" :columns="columns" :rows="entries" :filters="filters"
      :sort-options="[{ key: 'name', direction: 'desc', label: 'Name, Z to A' }]" sort-select-class="@5xl/page:hidden">
    <template #header="{ total, unfilteredTotal, narrowed: some, clear, values, filterLink }">
      <p>{{ some ? `${total} of ${unfilteredTotal ?? 0}` : total }}</p>
      <button @click="clear" />
      <a v-bind="filterLink('kind', values.kind?.[0] === 'a' ? [] : ['a'])">{{ link.href }} {{ narrowed }} {{ href }}</a>
    </template>
    <template #cell-name="{ row }">{{ name(row) }}</template>
  </DataTable>
  <DataTable caption="Entries" private-search :columns="columns" :rows="entries" :filters="filters">
    <template #header="list">
      <ListHeader v-bind="list" title="Entries" noun="entry" plural="entries" qualifier=", including old ones" stat-key="kind" :stats="stats">
        <template #actions><a href="/entries/create" class="btn primary">Add entry</a></template>
        <template #count="{ total, all, narrowed: some }">{{ some ? total : all }}</template>
      </ListHeader>
    </template>
  </DataTable>
  <ListHeader title="Menus" noun="menu" :total="3" :breadcrumb="[{ label: 'Pages', href: '/pages' }, { label: 'Menus' }]" />
  <!-- @vue-expect-error noun is required -->
  <ListHeader title="Menus" />
  <PageHeading title="Arc studio" :breadcrumb="[{ label: 'Products', href: '/products' }, { label: 'Arc studio' }]">
    <template #before><UserAvatar :user="{ name: 'Sam Taylor', avatar: null }" size="lg" /></template>
    <template #badges><span class="badge">Draft</span></template>
    <p>Updated <LocalDate value="2026-11-14T09:30:00.000000Z" with-time in-sentence locale="en-GB" time-zone="Europe/London" /></p>
    <template #actions><button class="btn" /></template>
  </PageHeading>
  <PageBreadcrumb :items="[{ label: 'Products', href: '/products' }, { label: 'Arc studio' }]" />
  <!-- @vue-expect-error a crumb needs a label -->
  <PageBreadcrumb :items="[{ href: '/products' }]" />
  <StatLink href="/x" label="Active" :count="4" :icon="icon" hue="green" current />
  <!-- @vue-expect-error the count is a number -->
  <StatLink label="Active" count="4" />
  <LocalDate :value="null">Never</LocalDate>
  <UserAvatar :user="{ name: 'Sam Taylor' }" />
  <!-- @vue-expect-error not an avatar size -->
  <UserAvatar :user="{ name: 'Sam Taylor' }" size="md" />
  <EmailAddress email="sam@forma.test">.</EmailAddress>
  <p>{{ status }} {{ today }} {{ hue }} {{ initials }}</p>
  <!-- @vue-expect-error a sort option needs a direction -->
  <DataTable caption="Entries" :columns="columns" :rows="entries" :sort-options="[{ key: 'name', label: 'Name' }]" />
  <DataTimeline caption="Log" :rows="entries" date-key="at">
    <template #header="{ total }">{{ total }}</template>
  </DataTimeline>

  <ConfirmDialog ref="dialog" id="delete" title="Delete?" confirm-label="Delete" tone="danger" :busy="form.processing" @confirm="form.delete('/x')" @close="form.reset()">
    <template #description>Gone <strong>for good</strong>.</template>
    <input name="password" />
  </ConfirmDialog>
  <ConfirmDialog id="archive" title="Archive?" confirm-label="Archive" form="archive-form" :busy="false"><form id="archive-form" /></ConfirmDialog>
  <ConfirmDialog id="send" title="Send?" description="It goes now." confirm-label="Send" cancel-label="Keep editing" />
  <!-- @vue-expect-error not a tone -->
  <ConfirmDialog id="x" title="X" confirm-label="X" tone="warning" />
  <!-- @vue-expect-error confirm-label is required -->
  <ConfirmDialog id="x" title="X" />
</template>
