import { action, observable } from 'mobx';

const UI = {
    @observable processingIsStarted: false,
    @observable infoText: '',

    @action startProcessing: function() {
        this.processingIsStarted = true;
    },

    @action stopProcessing: function() {
        this.processingIsStarted = false;
    }
}

export default UI;