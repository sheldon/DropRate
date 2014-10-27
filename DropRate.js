var express = require('express');
    app = express(),
    fs = require('fs'),
    https = require('https'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    BnetStrategy = require('passport-bnet').Strategy,
    sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database('./db/DropRate.sqlite');

passport.use(new BnetStrategy({
    clientID: "f3fmq7n39vkn97znkyrr5dz4c7f9qzxf",
    clientSecret: "TQrRjmxwuNxHnTRBYWWGakNuUctn7SEB",
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

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS feed (character, name, type, timestamp, itemId)");
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
                feed.feed.forEach(function(activity){
                    db.serialize(function() {
                        db.run("INSERT INTO feed (character, name, type, timestamp, itemId) VALUES ($character, $name, $type, $timestamp, $itemId)", {
                            $character: 'Litae',
                            $name: activity.name,
                            $type: activity.type,
                            $timestamp: activity.timestamp,
                            $itemId: activity.itemId
                        });
                    });
                });
            });
        }).end();
    }, 2000);

    res.end();
});

var server = https.createServer({
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt'),
}, app).listen(3000);

var gracefulShutdown = function() {
    server.close(function() {
        db.close(function(){
            process.exit()
        });
    });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
