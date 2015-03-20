var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var session = require('express-session')
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./db');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var gravatar = require('gravatar');
var formidable = require('formidable');
var fs = require('fs');
var validator = require('validator');
var mkdirp = require('mkdirp');
var crypto = require('crypto');
var waiter = require('./waiter');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
ejs.open = '{{';
ejs.close = '}}';



	var $APP_URL = 'http://cardcoffer.com';
	process.env = process.env || {};
	process.env.PORT = 80;
// var $APP_URL = 'http://localhost:7878';

// passport.use(new FacebookStrategy({
// 	clientID: '1689330287957986',//'1689339931290355',
// 	clientSecret: '67e74c5952b445e5bbef7ad3cd65b490',//'ea007a686dc72e5dc7b91b4058e42d01',
// 	callbackURL: "http://localhost:3000/auth/facebook/callback"
// }, function(accessToken, refreshToken, profile, done) {
// 	// console.log(accessToken);
// 	// console.log(profile);
// 	profile.src = 'fac';
// }));
var SHA1 = function (str) {
	var shasum = crypto.createHash('sha1');
	shasum.update(str);
	return shasum.digest('hex');
}

var RAND_NOUNCE = 0;
function getRandomHash(str) {
	if (!str) str = "Hello!";
	str += (new Date()).getTime() + "--!" + (RAND_NOUNCE++);
	var shasum = crypto.createHash('sha1');
	shasum.update(str);
	return shasum.digest('hex');
}

var GOOGLE_CONSUMER_KEY = '633578824529-a24t28nh573a55cr45lutunprsalebgb.apps.googleusercontent.com';
var GOOGLE_CONSUMER_SECRET = 'Ihc2vk8hwrZsWRZakTMzvsSx';


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CONSUMER_KEY,
    clientSecret: GOOGLE_CONSUMER_SECRET,
	callbackURL: $APP_URL + '/auth/google/return'
}, function(accessToken, refreshToken, profile, done) {
	var id = profile.emails[0].value;
	db.users.findOne({_id: id}, function (err, doc) {
		if (err) throw err;
		if (doc) {
			return done(null, doc);
		}
		db.users.save({
			_id: id,
			profile: profile,
			stacks: [{
				_id: getRandomHash(id),	
				label: 'Recent Cards',
				date: new Date(),
				default: true,
				cards: []
			}],
			cards: []
		}, function (err, doc) {
			console.log(doc);
			done(null, doc);
		});
	});
}));
passport.use(new LocalStrategy({
	usernameField: 'email',
    passwordField: 'passwd'
}, function(username, password, done) {
	username = username.toLowerCase();
    db.users.findOne({ _id: username, password: SHA1(password)}, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
      	console.error(username, password);
        return done(null, false, { message: 'Incorrect username.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
	done(null, user._id);
});
passport.deserializeUser(function(id, done) {
	db.users.findOne({_id: id}, function(err, user) {
		done(err, user);
	});
});

var app = express();
//app.set('env', 'production');
function require_login(req, res, next) {
	if (req.user) {
		return next();
	}
	res.redirect('/login');
}
function render(res, f, d) {
	d = d || {};
	d.$url = $APP_URL;
	d.alert = d.alert || false;
	d.$gravatar = function(email, s) {
		return '/images/default.png';
		return gravatar.url(email, {s: s||40, r: 'pg', d: '404'});
	}
	res.render(f, d);
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: '-biz!boxS3kr3t', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	render(res, 'froont-page/index');
})

var ensureRegister = function (req, res, next) {
	if (!req.user.registered) {
		render(res, 'gregister', {$user: req.user});
		return;
	}
	return next();
}

app.post('/req_inv', function (req, res) {
	db.requests.save({email: req.body.e});

	var transporter = nodemailer.createTransport({
		host: 'localhost',
		ignoreTLS: true
	});
	transporter.sendMail({
	    from: 'info@cardcoffer.com',
	    to: 'invite@cardcoffer.com',
	    subject: 'New invitation request',
	    text: 'Hello!\nThis email address requested an invitation: ' + req.body.e + "\nPlease process it ASAP! \n Thanks!"
	});
	
	res.send({ok: true});
});
app.get('/lasdfjlasfgjlsadkjflakjlsdkjflasdjflariaoer03q4u', function (req, res) {
	db.requests.find(function (err, docs) {
		res.send(docs);
	});
});

app.get('/app', ensureLoggedIn('/login'), ensureRegister, function (req, res) {
	render(res, 'app/dashboard', {$user: req.user});
});
app.get('/gt', function (req, res) {
	for (var i=0;i<150;i++) {
		var t = getRandomHash(i*30);
		console.log("TTT ", t);
		db.tickets.save({_id: t, used: false});
	}
})
app.get('/login', function (req, res) {
	render(res, 'login');
});
app.get('/register/:tid', function (req, res, next) {
	db.tickets.findOne({ _id: req.params.tid}, function(err, ticket) {
		if (err || !ticket || ticket.used) { 
			var err = new Error('Not Found');
			err.status = 404;
			next(err);
			return;
		}
		render(res, 'app/register', {ticket: ticket._id});
    });
});
app.post('/register', function (req, res) {
	db.tickets.findOne({ _id: req.body.ticket}, function(err, ticket) {
		if (err || !ticket || ticket.used) { 
			var err = new Error('Not Found');
			err.status = 404;
			next(err);
			return;
		}
		var id = req.body.email.toLowerCase();
		db.users.findOne({_id: id}, function (err, doc) {
			if (err) throw err;
			if (doc) {
				return render(res, 'app/register', {error: 'exists', ticket: req.body.ticket});
			}
			if (req.body.name.length < 4 || req.body.passwd != req.body.cpasswd || req.body.passwd.length<6) {
				return render(res, 'app/register', {error: 'name/pass/cpass', ticket: req.body.ticket});	
			}
			db.users.save({
				_id: id,
				profile: {
					displayName: req.body.name
				},
				stacks: [{
					_id: getRandomHash(id),	
					label: 'Recent Cards',
					date: new Date(),
					default: true,
					cards: []
				}],
				cards: [],
				registered: true,
				password: SHA1(req.body.passwd)
			}, function (err, doc) {
				ticket.used = true;
				db.tickets.update({_id: req.body.ticket}, ticket);
				res.redirect('login?registered');
			});
		});
	});
});
app.post('/login', passport.authenticate('local', { successRedirect: '/app', failureRedirect: '/login'}));

// app.post('/gregister', ensureLoggedIn('/login'), function (req, res) {
// 	if (req.body.passwd.length<6 || req.body.passwd != req.body.cpasswd) {
// 		return render(res, 'gregister', {$user: req.user, error: 'passwd'});
// 	}
// 	req.user.registered = true;
// 	req.user.password = SHA1(req.body.passwd);
// 	db.users.update({_id: req.user._id}, req.user, function (err) {
// 		res.redirect('/app');
// 	});
// });

app.get('/app/logout', ensureLoggedIn('/login'), function (req, res) {
	req.logout();
	res.redirect('/');
});
app.get('/app/studio', ensureLoggedIn('/login'), function (req, res) {
	render(res, 'app/studio', {$user: req.user});
});
app.get('/app/stacks', ensureLoggedIn('/login'), function (req, res) {
	render(res, 'app/stacks', {$user: req.user});
});

app.get('/app/newstacks', ensureLoggedIn('/login'), function (req, res) {
	render(res, 'app/newstack', {$user: req.user});
});
app.get('/app/sdelete/:sid', ensureLoggedIn('/login'), function (req, res) {
	var sid = req.params.sid;
	var st = []
	for (var i=0;i<req.user.stacks.length;i++) {
		if (req.user.stacks[i]._id == sid) continue;
		st.push(req.user.stacks[i]);
	}
	req.user.stacks = st;
	db.users.update({_id: req.user._id}, req.user, function (err) {
		if (err) {
			return res.send({error: 'system'});
		}
		res.redirect('/app/newstacks');
	});

});
app.post('/app/p_new_stack', ensureLoggedIn('/login'), function (req, res) {

	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (!fields.label || fields.label.length < 5) return res.send({error: 'label'});

		var sid = getRandomHash(fields.label);
		var stack = {
			_id: sid,
			label: fields.label,
			date: new Date(),
			default: false,
			cards: []
		}
		req.user.stacks.push(stack);
		db.users.update({_id: req.user._id}, req.user, function (err) {
			if (err) {
				return res.send({error: 'system'});
			}
			res.send(stack);
		});

	});
});

app.get('/app/move-card/:cid/:sid', ensureLoggedIn('/login'), function (req, res, next) {
	var st = null;
	var c = null;
	for (var i=0;i<req.user.stacks.length;i++) {
		if (req.user.stacks[i]._id == req.params.sid) {
			st = req.user.stacks[i];
			break;
		}
	}
	if (st == null) return next();
	for (var i=0;i<req.user.stacks.length;i++) {
		var stack = req.user.stacks[i];
		for (var j=0;j<stack.cards.length;j++) {
			if (stack.cards[j]._id == req.params.cid) {
				c = stack.cards[j];
				st.cards.push(c);
				stack.cards.splice(j, 1);
			}
		}
	}
	if (c == null) {
		return next();
	}
	db.users.update({_id: req.user._id}, req.user, function (err) {
		if (err) {
			return res.send({error: 'system'});
		}
		res.send({done: 'ok'});
	});
});

app.post('/app/p_update_note/:cid/:sid', ensureLoggedIn('/login'), function (req, res, next) {
	var stack = null;
	var c = null;
	var data = req.body.note;
	for (var i=0;i<req.user.stacks.length;i++) {
		if (req.user.stacks[i]._id == req.params.sid) {
			stack = req.user.stacks[i];
			break;
		}
	}
	if (stack == null) return next();

	for (var j=0;j<stack.cards.length;j++) {
		if (stack.cards[j]._id == req.params.cid) {
			c = stack.cards[j];
			c.note = data;
			db.users.update({_id: req.user._id}, req.user, function (err) {
				if (err) {
					return res.send({error: 'system'});
				}
				res.send({done: 'ok'});
			});
			return;
		}
	}
	
});


app.post('/app/search_api', ensureLoggedIn('/login'), function (req, res, next) {
	var result = [];
	
	
	req.user.stacks.forEach(function (s) {
		console.error(s);
		s.cards.forEach(function (c) {
			console.log(c);
		});
	})
		
	//res.send({a:req.body.q});
});


app.get('/app/stack/:id', ensureLoggedIn('/login'), function (req, res, next) {
	if (!req.params.id) return next();
	var found = null;
	req.user.stacks.forEach(function (stack) {
		if (stack._id == req.params.id) found = stack;
	});
	if (!found) return next();
	var l = found.cards.length+1;
	var cards = [];
	var cb = function () {
		l--;
		if (l == 0) {
			found.cards = cards;
			render(res, 'app/viewstack', {$user: req.user, stack: found});
		}
	}
	cb();
	found.cards.forEach(function (c) {
		db.users.findOne({'cards': {$elemMatch: {_id: c._id}}}, function (err, doc) {
			console.log(c, err, doc);
			if (err || !doc) {
				return cb();
			}
			console.log(c._id);
			console.log(doc.cards);
			for (var j=0;j<doc.cards.length;j++) {
				if (doc.cards[j]._id == c._id) {
					doc.cards[j].note = c.note;
					console.log(doc.cards[j]);
					cards.push(doc.cards[j]);
					return cb();
				}
			}
		});
	});
});


app.get('/login', function (req, res, next) {
	render(res, 'login');
});

app.get('/app/card/:id', ensureLoggedIn('/login'), function (req, res, next) {
	if (!req.params.id) return next();
	var found = null;
	req.user.cards.forEach(function (card) {
		if (card._id == req.params.id) found = card;
	});
	if (!found) return next();
	render(res, 'app/viewcard', {$user: req.user, card: found});
});


app.get('/app/delete/:id', ensureLoggedIn('/login'), function (req, res, next) {
	if (!req.params.id) return next();
	var found = null;
	req.user.cards.forEach(function (card) {
		if (card._id == req.params.id) found = card;
	});
	if (!found) return next();
	render(res, 'app/deleteconfirm', {$user: req.user, card: found});
});

app.get('/app/delete_c/:id', ensureLoggedIn('/login'), function (req, res, next) {
	if (!req.params.id) return next();
	var found = null;
	for (var i=0;i<req.user.cards.length;i++) {
		var card = req.user.cards[i];
		if (card._id == req.params.id) {
			found = card;
			delete req.user.cards[i];
		}
	}
	if (!found) return next();
	db.users.update( { _id: req.user._id }, { $pull: { cards: { _id: req.params.id } } },function (err, data) {
		render(res, 'app/studio', {$user: req.user, alert: {class: 'success', title: 'Ok!', text: 'The card ' + found.label + ' has been deleted!'}});
	});
});


app.get('/app/exchange/:id', ensureLoggedIn('/login'), function (req, res, next) {
	if (!req.params.id) return next();
	db.users.findOne({'cards': {$elemMatch: {_id: req.params.id}}}, function (err, doc) {
		if (err) return next();
		for (var i=0;i<req.user.stacks.length;i++) {
			var stack = req.user.stacks[i];
			if (stack.default && stack.cards.indexOf(req.params.id) == -1) {
				stack.cards.push({_id: req.params.id, note: ''});
				db.users.update({_id: req.user._id}, req.user, function (err) {
					if (err) throw err;
					res.send("Ok!");
				});
				return;
			}
		}
		res.send("error");
	});
});

app.post('/app/p_new_card', ensureLoggedIn('/login'), function (req, res) {

	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		

		if (!fields.label || fields.label.length == 0) return res.send({error: 'label'});
		if (!fields.name || fields.name.length < 3) return res.send({error: 'name'});
		if (!fields.job_title) return res.send({error: 'job_title'});
		if (!fields.aff || fields.aff.length < 5) return res.send({error: 'aff'});
		if (fields.phone && fields.phone.length < 5) return res.send({error: 'phone'});
		if (fields.email && !validator.isEmail(fields.email)) return res.send({error: 'email'});
		
		var img = 'images/default.png';
		var att = null;

		var w = new waiter(2, function () {
			var cid = getRandomHash(fields.label);
			var card = {
				_id: cid,
				label: fields.label,
				name: fields.name,
				job_title: fields.job_title,
				aff: fields.aff,
				phone: fields.phone,
				email: fields.email,
				address: fields.address,
				img: img,
				att: att
			}
			db.users.update({_id: req.user._id}, {
				$push: {
					cards: card
				}
			}, function (err) {
				if (err) throw err;
				res.send(card);
			})
		});

		if (files.image) {
			if (files.image.type.indexOf('image') == -1) return res.send({error: 'image'});
			var img_path = './public/cardassets/img/' + getRandomHash(req.user._id) + '/';
			img = img_path.substr('./public/'.length) + files.image.name;
			mkdirp(img_path, function (err) {
				if (err) throw err;
				fs.rename(files.image.path, img_path + files.image.name , function (err) {
					if (err) throw err;
					w.ok();
				});
			});	
		}else {
			w.ok();
		}
		if (files.attachment) {
			if (files.attachment.type != 'application/pdf') return res.send({error: 'attachment'});
			var att_path = './public/cardassets/att/' + getRandomHash(req.user._id) + '/';
			att = att_path.substr('./public/'.length) + files.attachment.name;
			mkdirp(att_path, function (err) {
				if (err) throw err;
				fs.rename(files.attachment.path, att_path + files.attachment.name , function (err) {
					if (err) throw err;
					w.ok();
				});
			});
		}else {
			w.ok();
		}
		


	});
	//res.end("Hey");
});

app.post('/app/feedback', ensureLoggedIn('/login'), function (req, res) {
	var data = req.body.data;


	var transporter = nodemailer.createTransport({
		host: 'localhost',
		ignoreTLS: true
	});
	transporter.sendMail({
	    from: 'info@cardcoffer.com',
	    to: 'feedback@cardcoffer.com, info@cardcoffer.com',
	    subject: 'New feedback',
	    text: 'Hello!\nSomebody submitted a feedback!\n** ' + req.user._id + ' **\n\n------' + data + '\n'
	});
	

	res.send({ok: true});

});

// app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile', 'user_friends']}));
// app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

// app.get('/auth/google', passport.authenticate('google',{ scope: ['https://www.googleapis.com/auth/userinfo.profile',
//                                             'https://www.googleapis.com/auth/userinfo.email']}));
// app.get('/auth/google/return', passport.authenticate('google', { successRedirect: '/app', failureRedirect: '/login' }));

// catch 404a nd forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

app.set('port', process.env.PORT || 7878);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

module.exports = app;
