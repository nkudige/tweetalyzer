var server_name = window.location.host;
var server = io.connect(server_name);
console.log('Client: Connecting to server ' + server_name);

var lovePercent, hatePercent;
var loveOld;

server.on("new tweet", function(data) {

	lovePercent = Math.round(parseFloat(data.loveTweets) / parseFloat(data.totalTweets) * 100);
	hatePercent = Math.round(parseFloat(data.hateTweets) / parseFloat(data.totalTweets) * 100);

	$('#totalTweets').html(data.totalTweets);
	$('#loveTweets').html(data.loveTweets);
	$('#hateTweets').html(data.hateTweets);
	$('#lovePercent').html( lovePercent + '%');
	$('#hatePercent').html( hatePercent + '%');

	if(data.tweet_type==1) {
		$('#lovelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-success">' + data.screen_name + ': ' + data.text + '</li>');
	}
	
	if(data.tweet_type==2) {
		$('#hatelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-danger">' + data.screen_name + ': ' + data.text + '</li>');
	}

	if(data.tweet_type==3) {
		$('#lovelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-success">' + data.screen_name + ': ' + data.text + '</li>');
		$('#hatelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-danger">' + data.screen_name + ': ' + data.text + '</li>');
	}
	
});

server.on("connected", function() {
	console.log("Connected to server");
});

$(document).ready(function() {

	var isStreaming = false;
	$('#togglestream').on('click', function() {
		
		$('#entity1_title').html($('#entity1').val() + ' (<span id="loveTweets">0</span>) - <span id="lovePercent"></span>');
		$('#entity2_title').html($('#entity2').val() + ' (<span id="hateTweets">0</span>) - <span id="hatePercent"></span>');

		if(!isStreaming) {
			$('#tweettable').show();
			$('#togglestream').html('Stop Stream');
			server.emit("start stream", {entity_1: $('#entity1').val(), entity_2: $('#entity2').val()});
			isStreaming = true;
		}
		else {			
			$('#togglestream').html('Show Stream');
			server.emit("stop stream");
			isStreaming = false;
		}
	});

	var graph_interval = setInterval(function() {
		if(lovePercent != loveOld) {
			loveOld = lovePercent;
			var percents = [
		                  ['Love', lovePercent],
		                  ['Hate', hatePercent]
		              ];
			RenderPieChart('piechart', percents);
		}
	}, 3000);
});

            function RenderPieChart(elementId, dataList) {
                new Highcharts.Chart({
                    chart: {
                        renderTo: elementId,
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: true
                    }, title: {
                        text: 'How much love and hate do we have in the world?'
                    },
                    tooltip: {
                        formatter: function () {
                            return '<b>' + this.point.name + '</b>: ' + this.percentage + ' %';
                        }
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                color: '#000000',
                                connectorColor: '#000000',
                                formatter: function () {
                                    return '<b>' + this.point.name + '</b>: ' + this.percentage + ' %';
                                }
                            }
                        }
                    },
                    series: [{
                        type: 'pie',
                        name: 'Love vs Hate',
                        data: dataList
                    }]
                });
            };
//        }, 5000);
