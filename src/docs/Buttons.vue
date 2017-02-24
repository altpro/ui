<template>
    <div class="view">
        <div class="heading">
            <h1>Buttons</h1>
            <div class="actions">
                <button class="button primary">Profile <i>arrow_drop_down</i></button>
                <button class="button fab"><i>add</i></button>
            </div>
        </div>
        <div class="card">
            <p>The button element has an html button as it's root element. The only functionality of the component is to add a ripple on click.</p>
            <p>
                <button>Default</button>
                <button class="button">Default Button</button>
                <button class="button coloured">.coloured</button>
            </p>

            <h2>Classes</h2>
            <p>
                <button class="button primary">.primary</button>
                <button class="button secondary">.secondary</button>
                <button class="button success">.success</button>
                <button class="button info">.info</button>
                <button class="button warning">.warning</button>
                <button class="button danger">.danger</button>
                <button class="button raised">.raised</button>

            </p>
            <div>
                <button class="button fab"><i>add</i></button> .fab
                <button class="button fab mini"><i>add</i></button> .fab.mini
                <button class="button icon"><i>person</i></button> .icon
            </div>


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

    .button {
        background: transparent;
        border: none;
        border-radius: 2px;
        color: inherit;
        position: relative;
        height: 36px;
        margin: 0;
        min-width: 64px;
        padding: 0 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: $font-highlight;
        text-transform: uppercase;
        letter-spacing: .03em;
        will-change: box-shadow;
        transition: 0.2s ease-in-out;
        outline: none;
        cursor: pointer;
        text-decoration: none;
        line-height: 36px;

        &.flat {
            color: $primary;
        }

        &.dense {
            font-size: 13px;
            height: 32px;
            line-height: 32px;
        }

        &.raised {
            padding: 0 16px;
            @include shadow-3dp();
            &:hover {
                @include shadow-4dp();
            }
        }

        &:hover, &:focus {
            background: $icon-hover;
        }

        &[disabled], &.disabled {
            cursor: default;
            color: rgba($text, 0.5);
        }

        @each $state, $color in $states {
            &.#{$state} {
                padding: 0 16px;
                background: $color;
                color: #fff;

                &:hover, &:focus {
                    background-color: darken($color, 10%);
                }
                &[disabled], &.disabled {
                    background-color: rgba($color, 0.5);
                }
            }
        }

        &.secondary {
            padding: 0 16px;
            background: $icon-hover;
            &:hover, &:focus {
                background: darken($icon-hover, 5%);
            }
        }

        &.icon {
            background: transparent;
            border-radius: 50%;
            font-size: 24px;
            height: 32px;
            min-width: 32px;
            width: 32px;
            padding: 0;
            color: inherit;
            line-height: normal;

            &:hover, &:focus {
                background: $icon-hover;
            }

            &[disabled], &.disabled {
                color: rgba($text, 0.5);
                &:hover, &:focus {
                    background: transparent;
                }
            }

            @each $state, $color in $states {
                &.#{$state} {
                    color: $color;

                    &:hover, &:focus {
                        color: darken($color, 10%);
                    }
                    &[disabled], &.disabled {
                        color: rgba($color, 0.5);
                    }
                }
            }
        }
    }

    .fab {
        height: 56px;
        min-width: 56px;
        width: 56px;
        border-radius: 50%;
        line-height: normal;
        padding: 0;
        background: $success;
        color: #fff;
        @include shadow-4dp;
        position: relative;

        &.mini {
            height: 40px;
            min-width: 40px;
            width: 40px;
        }

        &:hover, &:focus {
            @include shadow-4dp();
            background-color: darken($success, 5%);
        }

        &[disabled], &.disabled {
            background-color: rgba($success, 0.5);
        }
    }

</style>