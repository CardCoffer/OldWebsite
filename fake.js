var Identity = require('fake-identity');
var request = require('request');
var crypto = require('crypto');
var mkdirp = require('mkdirp');

var RAND_NOUNCE = 0;
function getRandomHash(str) {
	if (!str) str = "Hello!";
	str += (new Date()).getTime() + "--!" + (RAND_NOUNCE++);
	var shasum = crypto.createHash('sha1');
	shasum.update(str);
	return shasum.digest('hex');
}


var db = require('./db');
Object.prototype.pretty = function () {
	return JSON.stringify(this, null, 4);
}
var g = function (cb) {
	request('http://api.randomuser.me/', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var user = JSON.parse(body).results[0].user;
			cb(user);
		}
	});
}


var fs = require('fs');
var SHA1 = function (str) {
	var shasum = crypto.createHash('sha1');
	shasum.update(str);
	return shasum.digest('hex');
}



for (var i=0;i<100;i++) {


g(function (user) {
	var cardId = getRandomHash(user.email);
	console.log(cardId);
	var r = request(user.picture.medium);
	var k =getRandomHash(user.email);
	var img_path = './public/cardassets/img/' + k + '/i.jpg';
	mkdirp('./public/cardassets/img/' + k, function (err) {
		if (err) throw err;
		r.on('response',  function (res) {
			res.pipe(fs.createWriteStream(img_path));
		});
	});	
	
	db.users.save({
		_id: user.email,
		registered: true,
		password: SHA1(user.password),
		profile: {
			displayName: user.name.first + " " + user.name.last,
			name: {
				familyName: user.name.last,
				givenName: user.name.first
			},
			emails: [{value: user.email}]	
		},
		stacks: [{
			_id: getRandomHash(user.password),	
			label: 'Recent Cards',
			date: new Date(),
			default: true,
			cards: []
		}],
		cards: [{
			_id: cardId,
			label: user.name.first + " card",
			name: user.name.first + " " + user.name.last,
			job_title: user.password,
			aff: user.location.city,
			phone: user.phone,
			email: user.email,
			address: user.location.street,
			img: 'cardassets/img/' + k + '/i.jpg',
			att: null
		}]
	});
});

}