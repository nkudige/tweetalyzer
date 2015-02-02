var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var server = require('http').createServer(app);

app.set('port', process.env.PORT || 5000);

server.listen(app.get('port'), function() {
    console.log("Tweet Analyzer server listening at port: " + app.get('port'));
});


var sio = require('socket.io').listen(server);
var twitter = require('ntwitter');

var tw = new twitter({
		consumer_key: "1uOZCC7mf7DpAOEc2Ns3gae0G",
		consumer_secret: "W2mTIZVLNT3qq2PIym8VclFblafw6eyRWlf4TXy4a130SUW0bf",
		access_token_key: "174580877-f0dcpKVfjNj4HDlwFPvVsgYcZHYF2cEzJeGVu97t",
		access_token_secret: "vxXa3uEQlVwlz2pqDU7gIjjwnjdpWse9QnYv0f6JK3arH"
	}),
	stream = null,
	track = "",
	users = [],
	loveTweets = 0,
	hateTweets = 0,
	totalTweets = 0,
	streamTo = {},
	endpoint = "http://www.sentiment140.com/api/bulkClassifyJson?appid=twitter@nithanth.com",
	tweetType = 0;

sio.sockets.on('connection', function(socket) {
    console.log('Web client connected');
	users.push(socket.id);
	streamTo[socket.id] = false;
	
	logConnectedUsers();
	
	socket.on("stop stream", function() {
		console.log("Stop stream requested");
		streamTo[socket.id] = false;
		
		var destroyStream = true;
		var x;
		for(x = 0; x < users.length; x ++) {
			if(streamTo[users[x]]) {
				destroyStream = false;
				break;
			}
		}
		if(destroyStream) {
			if(stream != null)
				stream.destroy();
			stream = null;
			console.log("Stream destroyed");
		}
		else {
		}
			
	});

	socket.on("start stream", function(entities) {
		track = entities.entity_1 + "," + entities.entity_2;
		streamTo[socket.id] = true;
		if(stream == null) {
			loveTweets = 0;
			hateTweets = 0;
			totalTweets = 0;
			console.log("Opening stream...");
			tw.stream("statuses/filter", {
				track: track
			}, function(s) {
				stream = s
				stream.on("data", function(data) {
					var polarity;
//					console.log(data.text);
					request.post(
						"http://www.sentiment140.com/api/bulkClassifyJson?appid=twitter@nithanth.com",
						{ json : { "language": "auto",
						  "data": [{"text": data.text}] } },
						function(error, response, body) {
							if (!error && response.statusCode == 200) {
								polarity = body.data[0].polarity;
								
								var e1_regex = new RegExp(entities.entity_1.replace(/,/g, '|'), 'i');
								var e2_regex = new RegExp(entities.entity_2.replace(/,/g, '|'), 'i');

								if(users.length > 0) {
									totalTweets += 1;
									if(data.text.match(e1_regex)) {
										loveTweets += 1;
										tweetType = 1;
									}
									if(data.text.match(e2_regex)) {
										hateTweets += 1;
										tweetType = 2;
									}
									if(data.text.match(e1_regex) && data.text.match(e2_regex)) {
										totalTweets += 1;
										tweetType = 3;
									}
										//socket.broadcast.emit("new tweet", {tweet_type: tweetType, screen_name: data.user.screen_name, text: data.text, totalTweets: totalTweets, loveTweets: loveTweets, hateTweets: hateTweets});
										//if(streamToUser)
											//socket.emit("new tweet", {tweet_type: tweetType, screen_name: data.user.screen_name, text: data.text, totalTweets: totalTweets, loveTweets: loveTweets, hateTweets: hateTweets});
									var i;
									for(i = 0; i < users.length; i ++) {
										if(streamTo[users[i]]) {
											sio.to(users[i]).emit("new tweet", {tweet_type: tweetType, tweet_polarity: polarity, screen_name: data.user.screen_name, text: data.text, profile_image_url: data.user.profile_image_url, totalTweets: totalTweets, loveTweets: loveTweets, hateTweets: hateTweets});
											//sio.to(users[i]).emit("new tweet", data);
										}
									}
									if(totalTweets == 10000) {
										console.log("Destroying stream");
										stream.destroy();
										stream = null
									}
								}
								else {
									//close stream if no user is connected
									console.log("Destroying stream");
									if(stream != null)
										stream.destroy();
									stream = null;
								}
							}
						}
					);

					//here
				});
			});
		}
	});


    socket.on('disconnect', function(socket) {
		console.log('Web client disconnected');
		delete streamTo[socket.id];
		users.splice(users.indexOf(socket.id), 1);
		logConnectedUsers();
    });

	socket.emit("connected", {
		tracking: track
	});
});

function logConnectedUsers() {
    console.log("============= CONNECTED USERS ==============");
    console.log(users.length);
	console.log(users);
    console.log("============================================");
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
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


module.exports = app;
