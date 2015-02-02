var server_name = window.location.host;
var server = io.connect(server_name);
console.log('Client: Connecting to server ' + server_name);

var lovePercent, hatePercent;
var loveOld;

var	e1_positive = 0;
var	e1_negative = 0;
var	e2_positive = 0;
var	e2_negative = 0;
var e1_positive_percent, e1_negative_percent, e2_positive_percent, e2_negative_percent;

server.on("new tweet", function(data) {

	lovePercent = parseInt(Math.round(parseFloat(data.loveTweets) / parseFloat(data.totalTweets) * 100));
	hatePercent = parseInt((parseFloat(data.hateTweets) / parseFloat(data.totalTweets) * 100));
	
	$('#totalTweets').html(data.totalTweets);
	$('#loveTweets').html(data.loveTweets);
	$('#hateTweets').html(data.hateTweets);
	$('#lovePercent').html( lovePercent + '%');
	$('#hatePercent').html( hatePercent + '%');
		
	var polarity = data.tweet_polarity;
	var emotion = "info";
	
	if(polarity == 0)
		emotion = "danger";
	else if(polarity == 4)
		emotion = "success";

	if(data.tweet_type==1) {
		if(polarity == 0)
			e1_negative ++;
		else if(polarity == 4)
			e1_positive ++;

		$('#lovelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-' + emotion + '">' + data.screen_name + ': ' + data.text + '</li>');
	}
	
	if(data.tweet_type==2) {
		if(polarity == 0)
			e2_negative ++;
		else if(polarity == 4)
			e2_positive ++;
		$('#hatelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-' + emotion + '">' + data.screen_name + ': ' + data.text + '</li>');
	}

	if(data.tweet_type==3) {
		if(polarity == 0) {
			e1_negative ++;
			e2_negative ++;
		}
		else if(polarity == 4) {
			e1_positive ++;
			e2_positive ++;
		}
		$('#lovelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-' + emotion + '">' + data.screen_name + ': ' + data.text + '</li>');
		$('#hatelist').prepend('<li style="background-image: url(' + data.profile_image_url + '); background-repeat:no-repeat; background-position: 0 .5em; padding-left:60px;" class="list-group-item list-group-item-' + emotion + '">' + data.screen_name + ': ' + data.text + '</li>');
	}

		
	if(e1_positive + e1_negative > 0) {
		e1_positive_percent = Math.round(parseFloat(e1_positive) / parseFloat(e1_positive + e1_negative) * 100);
		e1_negative_percent = 100.00 - e1_positive_percent;
		$('#e1_pos').html( '(' + e1_positive + ') - ' + e1_positive_percent + '%' );
		$('#e1_neg').html( '(' + e1_negative + ') - ' + e1_negative_percent + '%' );
	}
	
	if(e2_positive + e2_negative > 0) {
		e2_positive_percent = Math.round(parseFloat(e2_positive) / parseFloat(e2_positive + e2_negative) * 100);
		e2_negative_percent = 100.00 - e2_positive_percent;
		$('#e2_pos').html( '(' + e2_positive + ') - ' + e2_positive_percent + '%' );
		$('#e2_neg').html( '(' + e2_negative + ') - ' + e2_negative_percent + '%' );
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
			e1_positive = 0;
			e1_negative = 0;
			e2_positive = 0;
			e2_negative = 0;
		}
	});

	var graph_interval = setInterval(function() {
		if(lovePercent != loveOld) {
			loveOld = lovePercent;
			var percents = [
		                  [$('#entity1').val(), lovePercent],
		                  [$('#entity2').val(), hatePercent]
		              ];
			RenderPieChart('piechart', percents);
		}
	}, 10000);
});

            function RenderPieChart(elementId, dataList) {
                new Highcharts.Chart({
                    chart: {
                        renderTo: elementId,
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: true
                    }, title: {
                        text: 'Popularity'
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
