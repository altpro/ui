{{--
    <x-ui::multiselect name="size" label="Size" :options="['s' => 'Small', 'm' => 'Medium']" :selected="old('size', [])" required max="2" />
    Same markup as resources/js/Multiselect.vue; tests/browsers.spec.js checks they match.
    aria-* attributes go on the button, the control; the rest on the wrapper.
    Needs resources/js/multiselect.js loaded to keep the button current and for required and max.
--}}
@props(['name', 'label', 'options' => [], 'selected' => [], 'form' => null, 'max' => null, 'required' => false, 'disabled' => false, 'autofocus' => false])
@php($id = 'ui-'.\Illuminate\Support\Str::random(8))
@php($selected = collect($selected)->all())
@php($count = collect($options)->keys()->intersect($selected)->count())
<ui-multiselect {{ $attributes->class('multiselect')->whereDoesntStartWith('aria-') }} @if ($form) form="{{ $form }}" @endif @if ($max) max="{{ $max }}" @endif @required($required)>
    {{-- one line: whitespace between the item spans would show as spaces --}}
    <button type="button" class="input" popovertarget="{{ $id }}" data-count="{{ $count }}" @disabled($disabled) @if ($autofocus) autofocus @endif {{ $attributes->whereStartsWith('aria-') }}><span class="sr-only">{{ $label }}</span><span>@foreach ($options as $value => $text)<span @if (! in_array($value, $selected)) hidden @endif>{{ $text }}</span>@endforeach</span></button>
    <fieldset id="{{ $id }}" popover class="dropdown" aria-label="{{ $label }}" @disabled($disabled)>
        @foreach ($options as $value => $text)
            <label class="checkbox"><input type="checkbox" name="{{ $name }}[]" value="{{ $value }}" @if ($form) form="{{ $form }}" @endif @checked(in_array($value, $selected)) @disabled($max && $count >= $max && ! in_array($value, $selected))> {{ $text }}</label>
        @endforeach
    </fieldset>
</ui-multiselect>
