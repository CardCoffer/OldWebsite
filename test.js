var waiter = require('./waiter');

var w = new waiter(2, function () {
	console.log("Done");
});

setInterval(function () {
	console.log("ok");
	w.ok();
}, 1000);