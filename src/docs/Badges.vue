<template>
    <div class="view">
        <div class="heading">
            <h1>Badges</h1>
        </div>

        <div class="card">
            <p>Badges are simple css after pseudo elements with space for up to 3 (ideally just 2) characters. Apply to an element by adding a data-badge attribute:</p>
            <p><button class="button icon" data-badge="12"><i>notifications</i></button> <button class="button icon" data-badge="22"><i>email</i></button></p>
            <p>Style with <code>#{color}-badge</code> class</p>
            <p><button class="button icon success-badge" data-badge="12"><i>notifications</i></button> <button class="button icon danger-badge" data-badge="222"><i>email</i></button></p>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {

            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    [data-badge] {
        position: relative;

        &:after {
            content: attr(data-badge);
            position: absolute;
            display: flex;
            align-items: center;
            text-align: center;
            justify-content: center;
            align-content: center;
            top: -11px;
            right: -11px;
            width: 22px;
            height: 22px;
            text-transform: none;
            font-weight: $font-normal;
            border-radius: 50%;
            background: $primary;
            color: #fff !important;
            font-size: 11px;
        }
    }

    .icon[data-badge]:after {
        top: -6px;
        right: -6px;
    }

    @each $state, $color in $states {
        .#{$state}-badge[data-badge]:after {
            background: $color;
        }
    }

</style>