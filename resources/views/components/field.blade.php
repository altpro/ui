{{--
    <x-ui::field name="email" type="email" required />
    <x-ui::field name="category_id" type="select" :options="$categories" :value="$post->category" placeholder="Choose one" />
    <x-ui::field name="extras[]" type="checkbox" :options="$extras" :value="$order->extras" />
    Same markup as resources/js/Field.vue; tests/browsers.spec.js checks they match.
    A label, a control and its hint and errors, tied together by generated ids.
    The label defaults to the name: category_id and post[categoryId] both read "Category".
    Options take value => label, a list of strings, or models and arrays with id and name.
    The value takes old input first, and models are reduced to their ids. A date on a date-type input is formatted for it.
    `now` fills an empty date, time, datetime-local or month with the current one, in the app's timezone.
    Errors default to the page's $errors; a string, an array or another MessageBag also works.
    `class` lands on the .field, every other attribute on the control.
--}}
@use('Illuminate\Support\Arr')
@use('Illuminate\Support\Str')
@use('Illuminate\Contracts\Support\Htmlable')
@use('Illuminate\Contracts\Support\MessageBag')
@use('Illuminate\Support\ViewErrorBag')
@props(['name', 'type' => 'text', 'label' => null, 'hint' => null, 'prepend' => null, 'append' => null, 'options' => [], 'value' => null, 'errors' => null, 'bag' => 'default', 'id' => null, 'now' => false])
@php
    $base = Str::chopEnd($name, '[]');
    $key = trim(str_replace(['[', ']'], ['.', ''], $base), '.');
    $id ??= 'ui-'.Str::random(8);
    $label ??= ucfirst(strtolower(trim(preg_replace(['/_id$/', '/([a-z\d])([A-Z])/', '/[_-]+/'], ['', '$1 $2', ' '], Str::afterLast($key, '.')))));

    $items = collect($options)->all();
    $toId = fn ($v) => is_object($v) || is_array($v) ? data_get($v, 'id') ?? data_get($v, 'value') : $v;
    $options = collect($items)->mapWithKeys(fn ($o, $k) => is_object($o) || is_array($o)
        ? [$toId($o) => data_get($o, 'name') ?? data_get($o, 'label')]
        : [array_is_list($items) ? $o : $k => $o])->all();
    $group = $options && in_array($type, ['radio', 'checkbox']);
    $multi = $group && $type === 'checkbox';
    $boolean = ! $group && in_array($type, ['checkbox', 'switch']);

    // an unticked box submits nothing, so after a failed submit a missing key means unticked, not "use the default"
    $value = ($multi || $boolean) && session()->hasOldInput() ? old($key) : old($key, $value);
    $formats = ['date' => 'Y-m-d', 'time' => 'H:i', 'datetime-local' => 'Y-m-d\TH:i', 'month' => 'Y-m'];
    if ($now && blank($value) && isset($formats[$type])) {
        $value = now()->format($formats[$type]);
    }
    // a date cast is a Carbon, which would print as Y-m-d H:i:s, and a date input takes none of that
    if ($value instanceof DateTimeInterface && isset($formats[$type])) {
        $value = $value->format($formats[$type]);
    }
    if ($options) {
        $value = $multi ? collect($value)->map($toId)->all() : $toId($value);
        $picked = array_map('strval', (array) $value);
    }

    $errors = $errors instanceof ViewErrorBag ? $errors->getBag($bag) : $errors;
    $errors = $errors instanceof MessageBag ? $errors->toArray() : (array) $errors;
    $messages = array_values(array_unique(Arr::flatten(array_is_list($errors) ? $errors : Arr::where($errors, fn ($m, $k) => $k === $key || str_starts_with($k, "$key.")))));
    $describedby = implode(' ', array_filter([$hint ? "$id-hint" : null, $messages ? "$id-error" : null])) ?: null;
    $invalid = $messages ? 'true' : null;
    $control = $attributes->except(['class', $type === 'select' ? 'placeholder' : '']);
@endphp
<{{ $group ? 'fieldset' : 'div' }} {{ $attributes->only('class')->class('field')->merge($group ? ['id' => $id, 'aria-describedby' => $describedby] : []) }}>
    @if ($group)
        <legend>{{ $label }}</legend>
        @foreach ($options as $v => $text)
            <label class="{{ $type }}"><input {{ $control->merge(['type' => $type, 'name' => $multi ? $base.'[]' : $name, 'value' => $v, 'aria-invalid' => $invalid]) }} @checked(in_array((string) $v, $picked, true))> {{ $text }}</label>
        @endforeach
    @elseif ($boolean)
        {{-- value 1, not the browser's "on", so Laravel's boolean rule takes it --}}
        <label class="{{ $type === 'switch' ? 'switch' : 'checkbox' }}"><input {{ $control->merge(['type' => 'checkbox', 'value' => '1', 'role' => $type === 'switch' ? 'switch' : null, 'id' => $id, 'name' => $name, 'aria-describedby' => $describedby, 'aria-invalid' => $invalid]) }} @checked($value)> {{ $label }}</label>
    @else
        <label for="{{ $id }}">{{ $label }}</label>
        {{-- several files under one name need [], or PHP keeps the last --}}
        @php($control = $control->merge(['id' => $id, 'name' => $type === 'file' && $attributes->get('multiple') ? $base.'[]' : $name, 'aria-describedby' => $describedby, 'aria-invalid' => $invalid]))
        @if ($type === 'textarea')
            <textarea {{ $control->class('input') }}>{{ $value }}</textarea>
        @elseif ($type === 'select')
            <select {{ $control->class('input') }}>
                @if ($attributes->has('placeholder'))
                    <option value="">{{ $attributes->get('placeholder') }}</option>
                @endif
                @foreach ($options as $v => $text)
                    <option value="{{ $v }}" @selected(in_array((string) $v, $picked, true))>{{ $text }}</option>
                @endforeach
            </select>
        @else
            {{-- passwords are never flashed back, and a file input cannot take a value --}}
            @php($control = $control->merge(['type' => $type, 'value' => in_array($type, ['password', 'file']) ? null : $value]))
            @if ($prepend || $append)
                {{-- a string sits in a span; a slot (a currency select, say) goes in as written --}}
                <label class="input">
                    @if ($prepend instanceof Htmlable){{ $prepend }}@elseif ($prepend)<span>{{ $prepend }}</span>@endif
                    <input {{ $control }}>
                    @if ($append instanceof Htmlable){{ $append }}@elseif ($append)<span>{{ $append }}</span>@endif
                </label>
            @else
                <input {{ $control->class($type === 'range' ? 'range' : 'input') }}>
            @endif
        @endif
    @endif
    @if ($hint)
        <p class="hint" id="{{ $id }}-hint">{{ $hint }}</p>
    @endif
    @if (count($messages) === 1)
        <p class="error" id="{{ $id }}-error">{{ $messages[0] }}</p>
    @elseif ($messages)
        <ul class="error" id="{{ $id }}-error">
            @foreach ($messages as $message)
                <li>{{ $message }}</li>
            @endforeach
        </ul>
    @endif
</{{ $group ? 'fieldset' : 'div' }}>
