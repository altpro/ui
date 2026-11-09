<script setup>
import DataTimeline from "@ui/DataTimeline.vue";

// dated from today, so the demo always has a Today and a Yesterday
const at = (daysAgo, hours, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};
const people = ["Steve Rayner", "Ann Okafor", "Marek Nowak"];
const events = [
  ["price", "changed the price of Arc headphones"],
  ["stock", "counted the stock in Bay 4"],
  ["note", "left a note on order 1042"],
  ["price", "changed the price of Dot earbuds"],
  ["archive", "archived the Mono mini"],
];
const entries = [
  ...Array.from({ length: 34 }, (_, i) => {
    const [type, action] = events[i % events.length];
    return { id: i + 1, at: at(Math.floor(i / 3), 16 - (i % 3) * 3, 5 * (i % 5)), person: people[i % people.length], type, action, flagged: type === "archive", team: i % 4 === 0 ? "Warehouse" : "Office" };
  }),
  { id: 35, at: at(420, 9, 30), person: "Steve Rayner", type: "note", action: "created the catalogue", flagged: false, team: "Office" },
  { id: 36, at: "not a date", person: "Import job", type: "note", action: "brought in a row with no usable date", flagged: false, team: "Office" },
];
const options = (...values) => values.map((value) => ({ value, label: value }));
const typeOptions = [{ value: "price", label: "Price" }, { value: "stock", label: "Stock" }, { value: "note", label: "Note" }, { value: "archive", label: "Archive" }];
const inlineFilters = [
  { key: "type", label: "Event", type: "select", options: typeOptions },
  { key: "person", label: "Person", type: "multiple", options: options(...people) },
  { key: "flagged", label: "Flagged only", type: "boolean" },
  { key: "when", label: "When", type: "daterange", field: "at", presets: true },
];
const drawerFilters = [
  { key: "type", label: "Event", type: "select", options: typeOptions },
  { key: "person", label: "Person", type: "multiple", options: options(...people) },
  { key: "flagged", label: "Flagged only", type: "boolean" },
  { key: "when", label: "When", type: "daterange", field: "at" },
];
const teamFilters = [
  { key: "team", label: "Team", type: "select", options: options("Office", "Warehouse"), default: ["Office"] },
  { key: "type", label: "Event", type: "select", options: typeOptions },
];
const dot = (row) => (row.flagged ? "danger" : undefined);
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-xl font-semibold">An audit log</h2>
    <p class="text-sm muted">One <code>.timeline</code> per day, under a heading, so the line stops at each day. <code>entry-class</code> colours a dot. Hand it the rows and it searches, filters, orders and pages them; hand it a paginator and the server has.</p>
    <DataTimeline caption="Audit log" name="audit" :rows="entries" date-key="at" :filters="inlineFilters" :searchable="['person', 'action']" :per-page="10" :heading-level="3" :entry-class="dot" search-placeholder="Search names or events">
      <template #entry="{ row }"><p><b>{{ row.person }}</b> {{ row.action }}</p></template>
    </DataTimeline>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Filters in a drawer</h2>
    <p class="text-sm muted"><code>filter-display="drawer"</code> keeps them behind one button. Controls change a draft, Apply commits it once, and anything else that closes the drawer lets it go. An <code>.avatar</code> in <code>#marker</code> takes the dot's place.</p>
    <DataTimeline caption="Activity" name="activity" :rows="entries" date-key="at" :filters="drawerFilters" filter-display="drawer" :searchable="['person', 'action']" :per-page="5" :heading-level="3">
      <template #marker="{ row }"><span class="avatar">{{ row.person[0] }}</span></template>
      <template #entry="{ row }"><p><b>{{ row.person }}</b> {{ row.action }}</p></template>
    </DataTimeline>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">What the badge counts</h2>
    <p class="text-sm muted">By default, every filter in force, so a list narrowed by a default says so. With no filters in force there is no badge.</p>
    <DataTimeline caption="Team activity" name="team" :rows="entries" date-key="at" :filters="teamFilters" filter-display="drawer" :search="false" :per-page="5" :heading-level="3">
      <template #entry="{ row }"><p><b>{{ row.person }}</b> {{ row.action }}</p></template>
    </DataTimeline>
    <p class="text-sm muted"><code>filter-count="changed"</code> counts only what the reader has set to something other than the default.</p>
    <DataTimeline caption="Changed activity" name="changed" :rows="entries" date-key="at" :filters="teamFilters" filter-display="drawer" filter-count="changed" :search="false" :per-page="5" :heading-level="3">
      <template #entry="{ row }"><p><b>{{ row.person }}</b> {{ row.action }}</p></template>
    </DataTimeline>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Nothing to show</h2>
    <DataTimeline caption="Notes" name="notes" :rows="[]" date-key="at" empty-message="Nothing has been recorded yet." :search="false" :heading-level="3" />
  </section>
</template>
