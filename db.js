// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : 'onClipEvent',
//   database : 'bb'
// });

// connection.connect();

// module.exports = {
// 	query: function (q, cb) {
// 		connection.query(q, cb);
// 	},
// 	end: function () {
// 		connection.end();
// 	}
// }

var mongojs = require('mongojs');
var db = mongojs('localhost/bb', ['users', 'tickets', 'requests']);
module.exports = db;