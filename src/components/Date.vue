<template>
    <div class="date-picker">
        <div class="header">
            <span>{{ weekday }}</span>
            <span>{{ date.getDate() }} {{ monthName(date.getMonth()) }}</span>
            {{ date.getFullYear() }}
        </div>
        <div class="picker">
            <div class="controls">
                <button type="button" @click="prev"><i>navigate_before</i></button>
                <span class="current-month">
                    {{ monthName(month) }}
                    <input type="number" v-model="year" size="4">
                </span>
                <button type="button" @click="next"><i>navigate_next</i></button>
            </div>
            <div class="days">
                <div class="weekday">M</div>
                <div class="weekday">T</div>
                <div class="weekday">W</div>
                <div class="weekday">T</div>
                <div class="weekday">F</div>
                <div class="weekday">S</div>
                <div class="weekday">S</div>
                <template v-for="i in days">
                    <button v-if="i > 0"
                            class="day"
                            v-text="i"
                            :class="{ selected: isSelected(i) }"
                            @click="select(i)">
                    </button>
                    <div v-else class="pad"></div>
                </template>
            </div>
            <div class="time" v-if="time">
                <input type="number" v-model="h" min="0" max="23"> <span>:</span> <input type="number" v-model="m" min="0" max="59">
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            value: null,
            time: Boolean
        },

        data () {
            return {
                year: new Date().getFullYear(),
                month: new Date().getMonth(),
                day: new Date().getDate(),
                h: new Date().getHours(),
                m: new Date().getMinutes()
            }
        },

        computed: {
            date() {
                return this.value ? new Date(this.value) : new Date();
            },

            weekday() {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                return days[this.date.getDay()];
            },

            days() {
                let pad = new Date(this.year, this.month).getDay();
                pad = pad > 0 ? pad - 1 : 6; // Offset for monday being first day of the week
                const days = new Array(pad).fill(0);
                const daysInMonth = 32 - new Date(this.year, this.month, 32).getDate();

                for (let i = 0; i < daysInMonth; i++) {
                    days.push(i + 1);
                }

                return days;
            }
        },

        methods: {
            next() {
                const date = new Date(this.year, this.month);
                date.setMonth(date.getMonth() + 1);
                this.month = date.getMonth();
                this.year = date.getFullYear();
            },

            prev() {
                const date = new Date(this.year, this.month);
                date.setMonth(date.getMonth() - 1);
                this.month = date.getMonth();
                this.year = date.getFullYear();
            },

            isSelected(day) {
                return this.date.toDateString() === new Date(this.year, this.month, day).toDateString();
            },

            select(day) {
                const date = new Date(this.year, this.month, day);
                console.log(date.toISOString());
            },

            monthName(month) {
                const months = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                return months[month];
            },
        },

    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    $daySize: 36px;

    .date-picker {
        background: #fff;
        border-radius: 2px;
        position: absolute;
        display: flex;
        flex-direction: column;
        @include shadow-4dp;

        @media #{$desktop} {
            flex-direction: row;
        }

        .header {
            color: #fff;
            background: $primary;
            padding: 16px;
            font-size: 18px;
            span:first-child {
                font-size: 13px;
                display: block;
                color: $grey-lighter;
            }

            @media #{$desktop} {
                span {
                    display: block;
                }

                width: 145px;
            }
        }

        .picker {
            padding: 8px;
        }

        .days {
            display: flex;
            width: $daySize * 7;
            flex-wrap: wrap;
            height: $daySize * 7;
        }

        .day, .pad, .weekday {
            display: flex;
            justify-content: center;
            text-align: center;
            align-items: center;
            border-radius: 50%;
            width: $daySize;
            height: $daySize;
        }

        .weekday {
            color: $grey-light;
            font-size: 12px;
            font-weight: $font-bold;
        }

        button:hover, button:focus {
            background: $grey-lighter;
        }

        .selected {
            background: $primary;
            color: #fff;
            &:hover, &:focus {
                background: $primary;
            }
        }

        .controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: $font-bold;

            button {
                border-radius: 50%;
                display: inline-flex;
                width: 32px;
                height: 32px;
                justify-content: center;
                align-items: center;
            }

            span {
                display: inline-flex;
                padding-left: 15px;
            }

            input {
                color: inherit;
                width: 50px;
                border: none;
                display: inline-flex;
                margin-left: 5px;
                font-weight: $font-bold;
            }
        }

        .time {
            display: flex;
            justify-content: center;
            align-items: center;

            span {
                margin: 0 4px;
            }

            input {
                width: 44px;
                border: 1px solid $divider;
                color: inherit;
                padding: 4px;
            }
        }

    }

</style>