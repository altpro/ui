<!--
  <LocalDate :value="order.created_at" />                 Today · Yesterday · 4 Nov · 4 Nov 2025
  <LocalDate :value="entry.created_at" with-time />       Today, 14:05
  Last login <LocalDate :value="user.last_login_at" in-sentence>never</LocalDate>

  A date as the reader's calendar has it: "Today", "Yesterday", then the day and month, with the year once it is not
  this one; `with-time` adds the time, for record facts and history, where it matters (a list shows the day only).
  `in-sentence` lowercases "today" and "yesterday" mid-sentence. It renders <time datetime>, and draws the words only
  after mount, as they depend on the reader's clock and timezone, which a server render does not know; they change at
  the reader's midnight. A missing value shows the default slot instead, a word such as "Never". The words are the
  same as DataTimeline's day headings. See local-date.md.
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { groupByDay, timeOfDay } from "./dataTable";
import { useToday } from "./useToday";

const props = withDefaults(
  defineProps<{
    /** An ISO date or timestamp, as Laravel sends one. A bare date (2026-11-04) is that day wherever it is read. */
    value?: string | null;
    withTime?: boolean;
    inSentence?: boolean;
    /** Defaults to `<html lang>`. */
    locale?: string;
    /** Defaults to the browser's. */
    timeZone?: string;
  }>(),
  { value: undefined, withTime: false, inSentence: false, locale: undefined, timeZone: undefined },
);
defineSlots<{ default?: () => unknown }>();

const mounted = ref(false);
onMounted(() => (mounted.value = true));
const today = useToday();

const label = computed(() => {
  // read so the words are worked out again when the reader's day changes
  void today.value;
  const options = { locale: props.locale, timeZone: props.timeZone };
  const day = groupByDay([props.value], (value) => value, options)[0]!.label;
  const words = props.inSentence ? day.replace(/^(Today|Yesterday)/, (word) => word.toLowerCase()) : day;
  const time = props.withTime ? timeOfDay(props.value, options)?.label : undefined;
  return time ? `${words}, ${time}` : words;
});
</script>

<template>
  <time v-if="value" :datetime="value">{{ mounted ? label : " " }}</time>
  <slot v-else />
</template>
