function Worker() {}
Worker.prototype.removeEventListener = function(channel, listener){};
Worker.prototype.addEventListener = function(channel, listener){};
module.exports = Worker;
