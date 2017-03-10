<template>
    <div class="context" v-if="open">
        <slot></slot>
    </div>
</template>

<script>
    import click from '../utils/click';

    export default {
        data() {
            return {
                open: false
            }
        },

        methods: {
            show() {
                const position = click();
                this.open = true;
                document.addEventListener('click', this.hide);
                document.addEventListener('keydown', this.hide);

                this.$nextTick(() => {
                    this.$el.style.left = position.x + 'px';
                    this.$el.style.top = position.y + 'px';
                });
            },

            hide(e) {
                this.open = false;
                document.removeEventListener('click', this.hide);
                document.removeEventListener('keydown', this.hide);
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .context {
        position: fixed;
        z-index: 16;
        background: $background;
        @include shadow-4dp;
    }
</style>
