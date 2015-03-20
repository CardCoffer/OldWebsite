var Waiter = function (n, cb) {
	return {
		ok: function () {
			n--;
			if (n==0) return cb();
		}
	}
}
module.exports = Waiter;