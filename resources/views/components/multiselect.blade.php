{{--
    <x-ui::multiselect name="size" label="Size" :options="['s' => 'Small', 'm' => 'Medium']" :selected="old('size', [])" />
    Same markup as resources/js/Multiselect.vue; tests/browsers.spec.js checks they match.
    Needs resources/js/multiselect.js loaded to keep the count current.
--}}
@props(['name', 'label', 'options' => [], 'selected' => []])
@php($id = 'ui-'.\Illuminate\Support\Str::random(8))
@php($selected = collect($selected)->all())
<ui-multiselect {{ $attributes->class('multiselect') }}>
    <button type="button" class="input" popovertarget="{{ $id }}"><span data-count="{{ collect($options)->keys()->intersect($selected)->count() }}">{{ $label }}</span></button>
    <fieldset id="{{ $id }}" popover class="dropdown" aria-label="{{ $label }}">
        @foreach ($options as $value => $text)
            <label class="checkbox"><input type="checkbox" name="{{ $name }}[]" value="{{ $value }}" @checked(in_array($value, $selected))> {{ $text }}</label>
        @endforeach
    </fieldset>
</ui-multiselect>
