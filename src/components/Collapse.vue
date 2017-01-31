<template>
    <div class="collapse">
        <div class="title" @click="toggle">
            <div class="title-text"><slot name="label">{{ label }}</slot></div>
            <i class="expand" :class="{ open: isOpen }">expand_more</i>
        </div>
        <div class="panel" ref="panel">
            <div class="content" ref="content">
                <slot></slot>
            </div>
        </div>
    </div>
</template>


<script>
    export default {
        props: {
            label: null,
            opened: Boolean
        },

        data() {
            return {
                isOpen: false,
                height: null
            }
        },

        mounted() {
            if (this.opened) this.open();
        },

        methods: {
            toggle() {
                if (this.isOpen) {
                    this.close();
                } else {
                    this.open();
                }
            },

            open() {
                this.$refs.panel.style.maxHeight = this.$refs.panel.scrollHeight+'px';
                this.isOpen = true;

                // Wait for the slide in animation to end then remove the max-height
                // to allow for dynamic content in the panel
                setTimeout(() => {
                    this.$refs.panel.style.maxHeight = 'none';
                }, 200);
            },

            close() {
                // Add the max-height back so it can animate closed.
                this.$refs.panel.style.maxHeight = this.$refs.panel.scrollHeight+'px';

                // Allow slight delay for property to change
                setTimeout(() => {
                    this.$refs.panel.style.maxHeight = 0;
                    this.isOpen = false;
                }, 1);
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .collapse {
        width: 100%;

        > .title {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }

        .title-text {
            display: flex;
            align-items: center;
        }

        > .panel {
            overflow: hidden;
            max-height: 0;
            transition: max-height 0.2s ease-in-out;
        }

        .content {
            padding-top: 13px;
            > *:last-child {
                margin-bottom: 0;
            }
        }

        .expand {
            transition: 0.2s ease-in-out;

            &.open {
                transform: rotateX(180deg);
            }
        }
    }
</style>
