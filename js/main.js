(function(undefined) {	
	
	//Uncomment the following line if testing locally.  Will need to install a plugin to get around cors restrictions
	//xmr.setServer('https://mining.digibyte.rocks/');
	
	
	
	var d = new Date();
	d.setUTCHours(1,0,0,0);
	document.getElementById('local').innerHTML=d.toLocaleTimeString();

	//spalsh screen
	document.getElementById('loading').style.display="block";
	document.getElementById('shadow').style.display="block";
	var jobs=2;
	var finishJob=function() {
		if (--jobs==0) {
			document.getElementById('loading').style.display="none";
			document.getElementById('shadow').style.display="none";
		}
	}
	
	//handle address click events
	var addressHistory={};
	var domQueryAssets = document.querySelector('#assets'); // the container for the variable content
	domQueryAssets.addEventListener('click', function(event) {
	  var closest = event.target.closest('.assets_row');
	  if (closest && domQueryAssets.contains(closest)) {
		var address=closest.getAttribute('address');
		var history=addressHistory[address];
		
		var html='<h1>History</h1>For: '+address+'<br><div id="history_table"><div class="history_row"><div class="history_address asset_header">Date</div><div class="history_type asset_header">Type</div><div class="history_change asset_header">Change</div></div>';
		for (var line of history) {
			var time=moment(new Date(line[0])).utc().format("YYYY-MM-DD");
			var assetChange=parseInt(line[1]);
			if (line[1]>0) {
				html+='<div class="history_row"><div class="history_address">'+time+'</div><div class="history_type">Asset Deposit</div><div class="history_change">'+assetChange+'</div></div>';
			}
			if (line[1]<0) {
				html+='<div class="history_row"><div class="history_address">'+time+'</div><div class="history_type">Asset Withdraw</div><div class="history_change">'+(0-assetChange)+'</div></div>';
			}
			if (line[2]>0) {
				html+='<div class="history_row"><div class="history_address">'+time+'</div><div class="history_type">Payout</div><div class="history_change">'+line[2]+'</div></div>';
			}
		}
		html+='</div><br><input type="button" class="close" value="Close">';
		
		document.getElementById('history').innerHTML=html;
		
		document.getElementById('history').style.display="block";
		document.getElementById('shadow').style.display="block";
	  }
	});
	
	//handle close button
	var domQueryAssets = document.querySelector('body'); // the container for the variable content
	domQueryAssets.addEventListener('click', function(event) {
	  var closest = event.target.closest('.close');
	  if (closest && domQueryAssets.contains(closest)) {
		document.getElementById('history').style.display="none";
		document.getElementById('shadow').style.display="none";
	  }
	});
	
	

	//chart functions
	var chartData;
	var loadChart=function(id,timeFrame=false) {
		var options={
			fullWidth: true,
			chartPadding: {
				right: 40
			},
			showPoint: false,
			axisX:	{
				type:	Chartist.FixedScaleAxis,
				divisor:	10,
				labelInterpolationFnc: function(value) {
					return moment(value).format('MMM D');
				}
			},
			axisY: {
				offset: 80,
				labelInterpolationFnc: function(value) {
					value=value.toFixed(document.getElementById(id).getAttribute('decimals'));
					return value;
				}
			},
			height: 200
		};
		var seriesData={series:[]};
		if (chartData[id]!=undefined) {
			//add series
			seriesData["series"].push({
				name: "value",
				data: chartDataArray(id,timeFrame)
			});
		} else {
			seriesData["series"].push({
				name: "max",
				data: chartDataArray(id+'Max',timeFrame)
			});
			seriesData["series"].push({
				name: "min",
				data: chartDataArray(id+'Min',timeFrame)
			});
			if (chartData[id+'Avg']!=undefined) {
				seriesData["series"].push({
					name: "avg",
					data: chartDataArray(id+'Avg',timeFrame)
				});
			}
			options['showArea']=true;
		}
		new Chartist.Line('#'+id,seriesData,options);
	}

	var chartDataArray=function(field,timeFrame) {
		var data=[];
		var end=chartData[field].length;
		var start=(timeFrame==false)?0:Math.max(0,end-timeFrame);
		
		for (var i=start;i<end;i++) {
			data.push({
				x:	chartData['time'][i],
				y:	chartData[field][i]
			});
		}
		return data;
	}
	

	//load and reload script
	var date=0;
	var reload=function() {
		var newDate=Math.floor(((new Date()).getTime()-3600000)/86400000);
		if (newDate!=date) {
			date=newDate;
			console.log(date);
		
			//load asset list
			xmr.getJSON('data/asset.json?d='+date).then(function(data) {
				var html='<div class="assets_row"><div class="asset_header assets_address">Address</div><div class="asset_header assets_count">Assets</div><div class="asset_header assets_balance">Balance</div></div>';
				for(var line of data) {
					addressHistory[line["address"]]=line["history"];
					html+='<div class="assets_row" address="'+line["address"]+'"><div class="assets_address">'+line["address"]+'</div><div class="assets_count">'+line["count"]+'</div><div class="assets_balance">'+line["balance"]+'</div></div>';
				}		
				document.getElementById("assets").innerHTML=html;
				finishJob();
			});
			
			
			
			//load chart data
			xmr.getJSON('data/chart.json?d='+date).then(function(data) {
				//load charts
				chartData=data;
				loadChart('profit');
				loadChart('valueSat');
				loadChart('valueCad');
				loadChart('expenseCovered');
				
				//calculate total
				var total=0;
				for (var profit of chartData['profit']) {
					total+=profit;
				}
				total*=3600;
				document.getElementById('total').innerHTML=total;
				
				//mark as finished loading
				finishJob();
			});
		
		}
	}
	setInterval(reload,6000);
	reload();
	
	
})();