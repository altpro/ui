<template>
    <div class="view">
        <div class="heading">
            <h1>Cards</h1>
        </div>

        <div class="card">
            <div class="toolbar">
                <h2>Heading</h2>
                <div class="actions">
                    <button class="button icon"><i>search</i></button>
                    <button class="button icon">
                        <i>more_vert</i>
                    </button>
                    <!--<button class="button fab mini" data-tooltip="Add"><i>add</i></button>-->
                </div>
            </div>

            <div class="content">
                <p>Lorem ipsum dolor sit amet, <span data-tooltip="Test tooltip">consectetur</span> adipisicing elit. Aperiam asperiores blanditiis consequatur debitis dicta dolore, dolorum ducimus eius enim ipsa iure molestiae omnis optio quidem saepe ut veritatis vitae voluptates? Lorem ipsum dolor sit amet, consectetur adipisicing elit. At debitis, doloribus dolorum magnam non quo sed? Dicta distinctio dolorem doloribus eum, fuga iure, laborum magnam nam odio optio saepe unde.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam asperiores blanditiis consequatur debitis dicta dolore, dolorum ducimus eius enim ipsa iure molestiae omnis optio quidem saepe ut veritatis vitae voluptates?</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam asperiores blanditiis consequatur debitis dicta dolore, dolorum ducimus eius enim ipsa iure molestiae omnis optio quidem saepe ut veritatis vitae voluptates?</p>
                <div>Lorem ipsum</div>
            </div>

            <div class="actions">
                <button class="button">Cancel</button>
                <button class="button">Ok</button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                date: null,
                select: null,
                dob: null,
                checkbox: false,
                radio: null,
                toggle: false,
                options: [
                    { value: 1, label: 'Option 1' },
                    { value: 2, label: 'Option 2' },
                    { value: 3, label: 'Option 3' }
                ]
            }
        }
    }
</script>