<script setup>
import { useId } from 'vue';
defineProps({ kind: String, name: String, angle: { type: Number, default: 0 } });
const uid = useId().replaceAll(':', '');
</script>
<template>
  <svg viewBox="0 0 440 360" role="img" :aria-label="name" class="demo-product-art">
    <defs>
      <linearGradient :id="uid + '-body'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--demo-object-highlight, var(--color-secondary))"/><stop offset=".45" stop-color="var(--demo-object-edge, var(--color-primary))"/><stop offset="1" stop-color="var(--demo-object, var(--color-foreground))"/></linearGradient>
      <linearGradient :id="uid + '-edge'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--demo-object-edge, var(--color-primary))"/><stop offset="1" stop-color="var(--demo-object, var(--color-foreground))"/></linearGradient>
      <pattern :id="uid + '-mesh'" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="var(--demo-object-highlight, var(--color-card))" opacity=".45"/></pattern>
    </defs>
    <ellipse cx="228" cy="310" rx="112" ry="11" fill="var(--demo-object, var(--color-foreground))" opacity=".12"/>
    <g :transform="`rotate(${angle} 220 180)`">
      <g v-if="kind === 'headphones'" transform="rotate(-14 220 180)">
        <path d="M127 216V150a93 93 0 0 1 186 0v66" fill="none" stroke="var(--demo-object, var(--color-foreground))" stroke-width="27"/>
        <path d="M127 190v-40a93 93 0 0 1 186 0v40" fill="none" :stroke="`url(#${uid}-body)`" stroke-width="19"/>
        <path d="M142 147a78 78 0 0 1 156 0" fill="none" stroke="var(--demo-object, var(--color-foreground))" stroke-width="9"/>
        <path d="M131 171v48M307 171v48" stroke="var(--demo-object-highlight, var(--color-secondary))" stroke-width="8"/>
        <rect x="105" y="199" width="57" height="100" rx="25" :fill="`url(#${uid}-edge)`"/>
        <rect x="116" y="197" width="44" height="103" rx="22" :fill="`url(#${uid}-body)`"/>
        <rect x="151" y="211" width="18" height="79" rx="9" fill="var(--demo-object, var(--color-foreground))"/>
        <rect x="277" y="199" width="57" height="100" rx="25" :fill="`url(#${uid}-body)`"/>
        <rect x="269" y="211" width="18" height="79" rx="9" fill="var(--demo-object, var(--color-foreground))"/>
        <path d="M319 235v22" stroke="var(--demo-object-highlight, var(--color-card))" stroke-width="2" stroke-linecap="round"/>
        <circle cx="135" cy="250" r="8" fill="none" stroke="var(--demo-object-highlight, var(--color-card))" opacity=".65" stroke-width="2"/>
      </g>
      <g v-else-if="kind === 'speaker'">
        <rect x="140" y="79" width="171" height="231" rx="38" :fill="`url(#${uid}-body)`"/>
        <rect x="129" y="83" width="160" height="220" rx="36" fill="var(--demo-object, var(--color-foreground))"/>
        <rect x="139" y="93" width="140" height="200" rx="28" :fill="`url(#${uid}-mesh)`"/>
        <circle cx="214" cy="153" r="39" fill="var(--demo-object-edge, var(--color-muted))" opacity=".4"/>
        <circle cx="214" cy="231" r="27" fill="var(--demo-object-edge, var(--color-muted))" opacity=".4"/>
        <ellipse cx="225" cy="79" rx="17" ry="7" fill="var(--demo-object-highlight, var(--color-secondary))"/>
        <circle cx="214" cy="282" r="3" fill="var(--demo-object-highlight, var(--color-card))"/>
      </g>
      <g v-else-if="kind === 'turntable'" transform="translate(0 55)">
        <path d="m71 77 277-20 37 164-286 18Z" fill="var(--demo-object, var(--color-foreground))"/>
        <path d="m71 66 277-20 37 164-286 18Z" :fill="`url(#${uid}-body)`"/>
        <ellipse cx="212" cy="131" rx="87" ry="65" fill="var(--demo-object, var(--color-foreground))"/>
        <ellipse cx="212" cy="129" rx="79" ry="57" fill="none" stroke="var(--demo-object-edge, var(--color-primary))" stroke-width="1"/>
        <ellipse cx="212" cy="129" rx="68" ry="49" fill="none" stroke="var(--demo-object-edge, var(--color-primary))" stroke-width="1"/>
        <ellipse cx="212" cy="129" rx="57" ry="41" fill="none" stroke="var(--demo-object-edge, var(--color-primary))" stroke-width="1"/>
        <ellipse cx="212" cy="129" rx="27" ry="20" fill="var(--demo-object-highlight, var(--color-secondary))"/>
        <ellipse cx="212" cy="129" rx="4" ry="3" fill="var(--demo-object, var(--color-foreground))"/>
        <path d="m333 78-8 65-34 23" fill="none" stroke="var(--demo-object-highlight, var(--color-secondary))" stroke-width="7" stroke-linecap="round"/>
        <circle cx="333" cy="78" r="11" fill="var(--demo-object, var(--color-foreground))"/>
        <path d="m289 161-9 10" stroke="var(--demo-object, var(--color-foreground))" stroke-width="12"/>
        <ellipse cx="125" cy="201" rx="8" ry="6" fill="var(--demo-object-highlight, var(--color-secondary))"/>
      </g>
      <g v-else>
        <rect x="114" y="154" width="213" height="137" rx="51" :fill="`url(#${uid}-body)`"/>
        <path d="M116 202h209" stroke="var(--demo-object, var(--color-foreground))" stroke-width="2" opacity=".5"/>
        <circle cx="221" cy="249" r="3" fill="var(--demo-object-highlight, var(--color-secondary))"/>
        <g transform="rotate(-24 161 115)"><rect x="154" y="93" width="24" height="74" rx="12" :fill="`url(#${uid}-edge)`"/><ellipse cx="161" cy="99" rx="25" ry="28" :fill="`url(#${uid}-body)`"/><ellipse cx="147" cy="97" rx="9" ry="12" fill="var(--demo-object, var(--color-foreground))"/></g>
        <g transform="rotate(24 275 103)"><rect x="260" y="81" width="24" height="74" rx="12" :fill="`url(#${uid}-edge)`"/><ellipse cx="275" cy="87" rx="25" ry="28" :fill="`url(#${uid}-body)`"/><ellipse cx="289" cy="85" rx="9" ry="12" fill="var(--demo-object, var(--color-foreground))"/></g>
      </g>
    </g>
  </svg>
</template>
