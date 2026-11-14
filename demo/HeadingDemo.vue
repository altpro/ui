<script setup>
import { Archive, CircleCheck, PencilLine, Plus } from "@lucide/vue";
import DataTable from "@ui/DataTable.vue";
import EmailAddress from "@ui/EmailAddress.vue";
import ListHeader from "@ui/ListHeader.vue";
import LocalDate from "@ui/LocalDate.vue";
import PageHeading from "@ui/PageHeading.vue";
import UserAvatar from "@ui/UserAvatar.vue";

const user = { name: "Samantha Okafor-Lindqvist", avatar: null, email: "samantha.okafor-lindqvist@forma.test" };
const lastLogin = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

// client mode, with no search box: each card counts the rows of its status, which is what its link shows
const statuses = ["Active", "Draft", "Archived"];
const products = Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `Sample ${String.fromCharCode(65 + i)}`, status: statuses[[0, 0, 1, 0, 2][i % 5]] }));
// the cards are the status filter's only control, so it has none in the toolbar
const filters = [{ key: "status", label: "Status", type: "select", options: statuses.map((value) => ({ value, label: value })), control: false }];
const columns = [
  { key: "name", label: "Name", sortable: true, hideable: false },
  { key: "status", label: "Status", hideable: false, thClass: "w-32" },
];
const count = (status) => products.filter((p) => p.status === status).length;
const stats = [
  { value: "Active", count: count("Active"), icon: CircleCheck, hue: "green" },
  { value: "Draft", count: count("Draft"), icon: PencilLine },
  { value: "Archived", count: count("Archived"), icon: Archive },
];
const statusClass = { Active: "soft success dot", Draft: "soft dot", Archived: "outlined dot" };
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-xl font-semibold">A record</h2>
    <p class="text-sm muted"><code>PageHeading.vue</code> on a page reached from a list: the breadcrumb above the <code>h1</code>, an avatar before it, badges beside it, a facts line under it and the page's actions at the end, under the title on a phone. The demo has no server, so the breadcrumb's link loads its page in full.</p>
    <div class="@container/page card">
      <PageHeading :title="user.name" :breadcrumb="[{ label: 'DataTable', href: '/datatable.html' }, { label: user.name }]">
        <template #before><UserAvatar :user="user" size="lg" /></template>
        <template #badges>
          <span class="badge soft success dot">Active</span>
          <span class="badge soft">You</span>
        </template>
        <p class="mt-1 text-sm wrap-anywhere muted"><EmailAddress :email="user.email" /> · Last login <LocalDate :value="lastLogin" with-time in-sentence /></p>
        <template #actions>
          <button type="button" class="btn outlined">Send password reset</button>
        </template>
      </PageHeading>
    </div>
<pre>&lt;PageHeading :title="user.name"
    :breadcrumb="[{ label: 'Users', href: listHref }, { label: user.name }]"&gt;
  &lt;template #before&gt;&lt;UserAvatar :user="user" size="lg" /&gt;&lt;/template&gt;
  &lt;template #badges&gt;
    &lt;span class="badge soft success dot"&gt;Active&lt;/span&gt;
  &lt;/template&gt;
  &lt;p class="mt-1 text-sm wrap-anywhere muted"&gt;
    &lt;EmailAddress :email="user.email" /&gt; · Last login
    &lt;LocalDate :value="user.last_login_at" with-time in-sentence /&gt;
  &lt;/p&gt;
  &lt;template #actions&gt;
    &lt;button type="button" class="btn outlined"&gt;Send password reset&lt;/button&gt;
  &lt;/template&gt;
&lt;/PageHeading&gt;</pre>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">A list</h2>
    <p class="text-sm muted"><code>ListHeader.vue</code> in a list's <code>#header</code> slot, given the slot's props: the count line, which says its base once a filter narrows the list, a quiet Clear, the primary action, and a card per status that filters the rows and takes its filter off again.</p>
    <div class="@container/page">
      <DataTable caption="Products" name="heading" class="framed" :columns="columns" :rows="products" :filters="filters" :search="false" :per-page="10"
          empty-message="No products yet." no-matches-message="No products match.">
        <template #header="list">
          <ListHeader v-bind="list" title="Products" noun="product" :stats="stats">
            <template #actions>
              <a href="#" class="btn primary"><Plus class="size-4" aria-hidden="true" /> Add product</a>
            </template>
          </ListHeader>
        </template>
        <template #cell-status="{ row }"><span class="badge sm" :class="statusClass[row.status]">{{ row.status }}</span></template>
      </DataTable>
    </div>
<pre>&lt;template #header="list"&gt;
  &lt;ListHeader v-bind="list" title="Products" noun="product" :stats="[
    { value: 'Active', count: statusCounts.Active, icon: CircleCheck, hue: 'green' },
    { value: 'Draft', count: statusCounts.Draft, icon: PencilLine },
    { value: 'Archived', count: statusCounts.Archived, icon: Archive },
  ]"&gt;
    &lt;template #actions&gt;
      &lt;Link href="/products/create" class="btn primary"&gt;&lt;Plus class="size-4" aria-hidden="true" /&gt; Add product&lt;/Link&gt;
    &lt;/template&gt;
  &lt;/ListHeader&gt;
&lt;/template&gt;</pre>
  </section>
</template>
