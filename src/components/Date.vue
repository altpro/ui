<template>
    <div class="date-input">
        <button type="button"
                class="selection"
                ref="trigger"
                :id="id"
                :disabled="disabled"
                @click="toggle">
            {{ selection }} <i v-if="! selection">event</i>
        </button>

        <div class="wrapper" v-if="open" ref="picker">
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
                        <template v-for="d in days">
                            <button v-if="d > 0"
                                    class="day"
                                    v-text="d"
                                    :class="{ selected: isSelected(d), today: isToday(d) }"
                                    @click="select(d)">
                            </button>
                            <div v-else class="pad"></div>
                        </template>
                    </div>

                    <div class="time" v-if="time">
                        <input type="number" :value="hour12" min="1" max="12" @input="setHour"> <span>:</span> <input type="number" v-model="minute" min="0" max="59" @input="done"> <button type="button" @click="switchNoon">{{ pm ? 'pm' : 'am' }}</button>
                    </div>

                    <div class="actions">
                        <button type="button" class="flat" v-if="!required" @click="clear">Clear</button>
                        <button type="button" class="primary-colour" @click="onOk">Ok</button>
                    </div>
                </div>
            </div>
        </div>

        <input type="hidden" :value="value" :name="name">
    </div>
</template>

<script>
    export default {
        props: {
            value: null,
            name: null,
            id: null,
            time: Boolean,
            required: Boolean,
            disabled: Boolean,
            min: null,
            max: null
        },

        data() {
            return {
                year: new Date().getFullYear(),
                month: new Date().getMonth(),
                day: new Date().getDate(),
                hour: new Date().getHours(),
                minute: new Date().getMinutes(),
                pm: new Date().getHours() > 12,
                inst: new Date(),
                open: false
            }
        },

        computed: {
            date() {
                return this.value ? new Date(this.value) : new Date();
            },

            selection() {
                return this.value ? this.display() : null;
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
            },

            hour12() {
                if (this.hour === 0) {
                    return 12;
                } else {
                    return this.hour > 12 ? this.hour - 12 : this.hour;
                }
            }
        },

        methods: {
            toggle() {
                if (this.open) {
                    this.close();
                } else {
                    this.show();
                }
            },

            show() {
                this.open = true;
                document.addEventListener('click', this.close);
                document.addEventListener('keydown', this.close);

                this.$nextTick(() => {
                    const rect = this.$refs.picker.getBoundingClientRect();
                    if (rect.bottom > window.innerHeight) {
                        this.$refs.picker.style.bottom = `30px`;
                    }
                });
            },

            close(e) {
                if (! e || ! this.$el.contains(e.target) || (e.which === 27 || e.keyCode === 27)) {
                    this.open = false;
                    document.removeEventListener('click', this.close);
                    document.removeEventListener('keydown', this.close);
                    this.$refs.trigger.focus();
                }
            },

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

            isToday(day) {
                return new Date().toDateString() === new Date(this.year, this.month, day).toDateString();
            },

            select(day) {
                this.day = day;
                this.done();
            },

            done() {
                const date = new Date(this.year, this.month, this.day);

                if (this.time) {
                    date.setHours(this.hour);
                    date.setMinutes(this.minute);
                }

                this.$emit('input', this.toValue(date));

                if (! this.time) {
                    this.close();
                }
            },

            onOk() {
                this.done();
                this.close();
            },

            monthName(month) {
                const months = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                return months[month];
            },

            setHour(e) {
                const set = Number(e.target.value);
                if (this.pm) {
                    this.hour = set === 12 ? set : set + 12;
                } else {
                    this.hour = set === 12 ? 0 : set;
                }
                this.done();
            },

            switchNoon() {
                this.pm = !this.pm;
                if (this.pm) {
                    this.hour = this.hour === 12 ? this.hour : this.hour + 12;
                } else {
                    this.hour = this.hour -12
                }

                this.done();
            },

            clear() {
                this.$emit('input', null);
                this.close();
            },

            toValue(date) {
                date = date ? date : this.date;

                if (this.time) {
                    return date.toISOString().substring(0, 19).replace('T', ' ');
                } else {
                    return date.toISOString().substring(0, 10);
                }
            },

            display() {
                if (this.time) {
                    return this.date.toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute:'2-digit',
                        hour12: true
                    });
                } else {
                    return this.date.toLocaleDateString('en-GB');
                }
            }
        },

    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    $daySize: 36px;

    .date-input {
        .selection i {
            color: $grey-light;
            font-size: 16px;
        }

        &.right {
            .date-picker {
                right: 0;
            }
        }

        .wrapper {
            position: absolute;
            z-index: 9;

            @media #{$mobile} {
                z-index: 16;
                position: fixed;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                background: rgba(0,0,0, 0.4);
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }

    .date-picker {
        color: $text;
        background: #fff;
        border-radius: 2px;
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

        .today {
            color: $primary;
            font-weight: $font-bold;
        }

        button {
            min-width: 0;
            font-weight: inherit;

            &:hover, &:focus {
                background: $grey-lighter;
            }
        }

        .selected {
            background: $primary;
            color: #fff !important;
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
                font-size: inherit;
            }
        }

        .current-month {
            display: inline-flex;
            align-items: center;
        }

        .time {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 0 12px;

            span {
                margin: 0 4px;
            }

            input, button {
                width: 48px;
                border: 1px solid $divider;
                color: inherit;
                padding: 4px 6px;
                line-height: 1;
            }

            button {
                padding: 8px 6px 7px;
                margin-left: 4px;
                width: auto;
            }
        }

        .actions {
            border-top: 1px solid $divider;
            padding: 8px 8px 0;
            margin: 0 -8px;
            display: flex;
            justify-content: flex-end;
            align-items: center;

            button {
                font-weight: $font-highlight;
                min-width: 64px;
            }
        }
    }
</style>