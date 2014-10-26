var express = require('express');
	app = express(),
	fs = require('fs'),
    https = require('https'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
	passport = require('passport'),
	BnetStrategy = require('passport-bnet').Strategy;

passport.use(new BnetStrategy({
	clientID: "f3fmq7n39vkn97znkyrr5dz4c7f9qzxf",
	clientSecret: "",
	callbackURL: "https://localhost:3000/auth/bnet/callback"
}, function (accessToken, refreshToken, profile, done){
	return done(null, profile);
}));

passport.serializeUser(function(user, done){
	done(null, user);
});

passport.deserializeUser(function(user, done){
	done(null, user);
});

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser());
app.use(session({ secret: 'Pig Royal Throw Risk' }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/bnet', passport.authenticate('bnet'));

app.get('/auth/bnet/callback',
    passport.authenticate('bnet', { failureRedirect: '/' }),
    function (req, res){
        res.redirect('/');
    });

app.get('/', function (req, res){
	setInterval(function(){
		https.request({
			host: 'eu.api.battle.net',
			path: '/wow/character/Chamber%20of%20Aspects/Litae?fields=feed&locale=en_GB&apikey=f3fmq7n39vkn97znkyrr5dz4c7f9qzxf'
		}, function(response) {
			var body = '';

			response.on('data', function (chunk) {
				body += chunk;
			});

			response.on('end', function () {
				var feed = JSON.parse(body);
				console.log(feed.feed.length);
			});
		}).end();
	}, 2000);

	res.end();
});

var server = https.createServer({
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt'),
}, app).listen(3000);

