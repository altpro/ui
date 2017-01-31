<template>
    <div class="notification" v-if="open">
        <div class="message" @click="hide" ref="message">
            {{ msg }}
        </div>
    </div>
</template>


<script>
    export default {
        data() {
            return {
                open: false,
                msg: ''
            }
        },

        created() {
            this.$root.$on('notification', msg => {
                this.msg = msg;
                this.open = true;
                setTimeout(this.hide, 3000);

                this.$nextTick(() => {
                    this.$refs.message.style.transform = 'translate(0, 0)';
                });
            });
        },

        methods: {
            hide() {
                if (this.open) {
                    this.$refs.message.style.transform = 'translate(0, 100%)';
                    setTimeout(() => {
                        this.open = false;
                    }, 250);
                }
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";
    $min-width: 568px;

    .notification {
        position: fixed;
        overflow: hidden;
        bottom: 0;
        left: 0;
        width: 100%;
        max-width: $min-width;
        z-index: 99;

        @media only screen and (min-width: $min-width + 1px) {
            left: 50%;
            margin-left: -($min-width / 2);
        }

        > .message {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 14px 24px;
            transform: translate(0, 100%);
            transition: 0.25s ease-in-out;
            background-color: #323232;
            color: #fff;
            font-size: 14px;
            border-radius: 2px 2px 0 0;
        }
    }

</style>
