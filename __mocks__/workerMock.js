function Worker() {
    this.listener = undefined;
}
Worker.prototype.removeEventListener = function(channel, listener){
    this.listener = undefined;
};
Worker.prototype.addEventListener = function(channel, listener){
    this.listener = listener;
};
Worker.prototype.postMessage = function(message){
    if (this.listener == null) {
        return;
    }

    this.listener({
        type: 'JEST_MOCK',
        code: message.code,
        payload: {}
    });
};

module.exports = Worker;
