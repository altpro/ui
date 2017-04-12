<template>
    <div class="view">
        <div class="heading">
            <h1>Forms</h1>
        </div>

        <form method="post" ref="form">
            <div class="card">
                <h2>Fields</h2>

                <p>The <code>ui-field</code> component is an input element/component wrapper that automatically add style and functionality. </p>
                <p><code>label</code> and <code>hint</code> are available as both props and slots (using template element). The child input is automatically monitored to check focus, disabled, required &amp; maxlength status and style the field accordingly.</p>
                <p><code>input.checkValidity()</code> is called on blur. When failing the native error message is displayed but can be overridden using the <code>error</code> prop.</p>

                <ui-field label="Text input">
                    <input type="text" v-model="text" name="text">
                </ui-field>

                <ui-field label="Required number input">
                    <input type="number" v-model="number" name="number" required>
                </ui-field>

                <ui-field label="Input with maxlength" hint="Counter is automatically added">
                    <input type="text" v-model="maxlength" name="maxlength" maxlength="10">
                </ui-field>

                <ui-field label="Disabled input">
                    <input type="text" v-model="disabled" name="disabled" disabled>
                </ui-field>

                <ui-field label="Textarea">
                    <textarea v-model="textarea" name="textarea" rows="4"></textarea>
                </ui-field>
            </div>

            <div class="card">
                <h2>Selects</h2>

                <ui-field label="Native select">
                    <select v-model="select">
                        <option v-for="option in options" :value="option.value" v-text="option.name"></option>
                    </select>
                </ui-field>

                <ui-field label="Select">
                    <ui-select v-model="select" name="select" :options="options" placeholder="Please select..."></ui-select>
                </ui-field>

                <ui-field label="Select Multiple" hint="Right click for context menu">
                    <ui-select-multiple v-model="multiple" name="multiple[]" :options="options" placeholder="Please select..."></ui-select-multiple>
                </ui-field>
            </div>

            <div class="card">
                <h2>Toggles</h2>

                <p>The <code>ui-toggle</code> component is a wrapper for native checkbox & radio inputs. With an html label element as the root <code>label</code> is available as both a prop and slot (using template or span element).</p>
                <h3 class="mt">Checkboxes</h3>

                <ui-toggle label="Jack">
                    <input type="checkbox" name="names[]" value="Jack" v-model="checkedNames">
                </ui-toggle>
                <ui-toggle label="John">
                    <input type="checkbox" name="names[]" value="John" v-model="checkedNames">
                </ui-toggle>
                <ui-toggle label="Mike">
                    <input type="checkbox" name="names[]" value="Mike" v-model="checkedNames">
                </ui-toggle>

                <p class="mt">Add <code>.inline</code> class to display inline, <code>.success</code>, <code>.info</code> etc. to change the checked colour.</p>

                <ui-toggle class="inline success" label="Jack">
                    <input type="checkbox" name="names[]" value="Jack" v-model="checkedNames">
                </ui-toggle>
                <ui-toggle class="inline info" label="John">
                    <input type="checkbox" name="names[]" value="John" v-model="checkedNames">
                </ui-toggle>
                <ui-toggle class="inline warning" label="Mike">
                    <input type="checkbox" name="names[]" value="Mike" v-model="checkedNames">
                </ui-toggle>

                <h3 class="mt">Radios</h3>

                <ui-toggle label="Yes">
                    <input type="radio" value="Yes" name="radio-input">
                </ui-toggle>

                <ui-toggle label="No">
                    <input type="radio" value="No" name="radio-input">
                </ui-toggle>

                <h3 class="mt">Switch</h3>

                <p>Add a class of <code>.switch</code> to turn a checkbox into a switch</p>

                <ui-toggle class="switch" label="Setting 1">
                    <input type="checkbox" name="toggle" v-model="switch1">
                </ui-toggle>

                <ui-toggle class="switch" label="Setting 2">
                    <input type="checkbox" name="toggle" v-model="switch2">
                </ui-toggle>

                <ui-toggle class="switch" label="Setting 3">
                    <input type="checkbox" name="toggle" v-model="switch3">
                </ui-toggle>

                <p class="mt mb0">A class of <code>.align-end</code> moves the control to the right on any toggle input (Useful within a divided list for settings).</p>
                <div class="list divided">
                    <div class="item">
                        <ui-toggle class="switch success align-end" label="Setting 1">
                            <input type="checkbox" name="toggle" v-model="switch1">
                        </ui-toggle>
                    </div>
                    <div class="item">
                        <ui-toggle class="switch info align-end" label="Setting 2">
                            <input type="checkbox" name="toggle" v-model="switch2">
                        </ui-toggle>
                    </div>
                    <div class="item">
                        <ui-toggle class="switch warning align-end" label="Setting 3">
                            <input type="checkbox" name="toggle" v-model="switch3">
                        </ui-toggle>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Dates</h2>
                <ui-field label="Date">
                    <input type="date" v-model="date" required>
                </ui-field>
                <ui-field label="Time">
                    <input type="time" v-model="time">
                </ui-field>
                <ui-field label="Datetime">
                    <input type="datetime" v-model="datetime">
                </ui-field>
                <ui-field label="Datetime">
                    <input type="datetime-local" v-model="datetime">
                </ui-field>
            </div>

            <button class="button primary">Submit</button>
        </form>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                text: null,
                textarea: null,
                email: null,
                number: null,
                disabled: null,
                required: null,
                maxlength: null,
                checkbox: false,
                picked: null,
                checkedNames: [],
                radio: null,
                date: null,
                time: null,
                datetime: null,
                switch1: false,
                switch2: true,
                switch3: false,
                select: null,
                html: null,
                multiple: null,
                options: [
                    {value: 1, name: 'Option 1'},
                    {value: 2, name: 'Option 2'},
                    {value: 3, name: 'Option 3'},
                    {value: 4, name: 'Option 4'},
                    {value: 5, name: 'Option 5'},
                    {value: 6, name: 'Option 6'},
                    {value: 7, name: 'Option 7'},
                    {value: 8, name: 'Option 8'},
                    {value: 9, name: 'Option 9'},
                    {value: 10, name: 'Option 10'}
                ]
            }
        },

        methods: {
            submit() {
                const form = new FormData(this.$refs.form);
                console.table(Array.from(form.entries()));
            }
        }
    }
</script>