var app = angular.module("app", []);

// $q 是内置服务，所以可以直接使用  
app.factory('SyncRequest', ['$http', '$q', function($http, $q) {
	return {
		query: function(theurl) {
				var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行  
				$http({
						method: 'GET',
						url: theurl
					})
					.success(function(data, status, headers, config) {
						deferred.resolve(data.data.content); // 声明执行成功，即http请求数据成功，可以返回数据了
					})
					.error(function(data, status, headers, config) {
						deferred.reject(data); // 声明执行失败，即服务器返回错误  
					});
				return deferred.promise; // 返回承诺，这里并不是最终数据，而是访问最终数据的API  
			} // end query  
	};
}]);

app.directive('datePicker', function() {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			minDate: '@',
		},
		link: function(scope, element, attr, ngModel) {

			element.val(ngModel.$viewValue);

			function onpicking(dp) {
				var date = dp.cal.getNewDateStr();
				scope.$apply(function() {
					ngModel.$setViewValue(date);
				});
			}

			element.bind('click', function() {
				WdatePicker({
					onpicking: onpicking,
					dateFmt: 'yyyy-MM-dd HH:mm:ss'
					//minDate: (scope.minDate || '%y-%M-%d'),
				})
			});
		}
	};
});

app.controller("indexCtrl", function($scope, $http, SyncRequest) {
	var conditionItemIndex = 0;

	function getConditionItem(dimensionalityName, functionName) { //use factory
		var conditionItem = new Object();
		conditionItem.dimensionalityName = dimensionalityName;
		conditionItem.functionName = functionName;
		return conditionItem;
	}
	$scope.conditionList = [];

	$scope.newConf = function() {
		conditionItemIndex++;
		var tempitem = getConditionItem(("dimensionalityName" + conditionItemIndex.toString()), ("functionName" + conditionItemIndex.toString()));
		$scope.conditionList.push(tempitem);
		$('select').selected();
	}


	$scope.geographicInfo = {};

	var citiesPromise = SyncRequest.query("https://www.zhaobaodong.space/dimGeog/find?type=1&page=1&count=50"); // 同步调用，获得承诺接口  
	citiesPromise.then(function(data) { // 调用承诺API获取数据 .resolve  
		$scope.geographicInfo.provinces = data;
	}, function(data) { // 处理错误 .reject  
		console.log("发生网络错误data:", data);
	});

	var citiesPromise = SyncRequest.query("https://www.zhaobaodong.space/dimGeog/find?type=2&page=1&count=50&parentId=1"); // 同步调用，获得承诺接口  
	citiesPromise.then(function(data) { // 调用承诺API获取数据 .resolve  
		$scope.geographicInfo.cities = data;
	}, function(data) { // 处理错误 .reject  
		console.log("发生网络错误:", data);
	});

	var areaesPromise = SyncRequest.query("https://www.zhaobaodong.space/dimGeog/find?type=3&page=1&count=50&parentId=2"); // 同步调用，获得承诺接口  
	areaesPromise.then(function(data) { // 调用承诺API获取数据 .resolve  
		$scope.geographicInfo.areaes = data;

	}, function(data) { // 处理错误 .reject  
		console.log("发生网络错误:", data);
	});

	var companesPromise = SyncRequest.query("https://www.zhaobaodong.space/dimWorkShop/find?page=1&count=50"); // 同步调用，获得承诺接口  
	companesPromise.then(function(data) { // 调用承诺API获取数据 .resolve  
		$scope.companes = data;
	}, function(data) { // 处理错误 .reject  
		console.log("发生网络错误:", data);
	});
	
	var adimTypesPromise = SyncRequest.query("https://www.zhaobaodong.space/dimType/find?page=1&count=50"); // 同步调用，获得承诺接口  
	adimTypesPromise.then(function(data) { // 调用承诺API获取数据 .resolve  
		$scope.adimTypes = data;
	}, function(data) { // 处理错误 .reject  
		console.log("发生网络错误:", data);
	});
	

	$scope.submit = function(condition) {
		var conditionListString = '';
		//取出数组中的值生成条件字符串
		for (var i in $scope.conditionList) {
			var tempDimensionalityName = $scope.conditionList[i].dimensionalityName;
			var tempFunctionName = $scope.conditionList[i].functionName;
			var tempString = "&lines=" + ($scope[tempDimensionalityName].toString() + '-' + $scope[tempFunctionName].toString());
			conditionListString += tempString;
		}
		var conditionString = "";
		if (condition) {
			//将所有普通的参数对象转换成字符串形式
			for (var i in condition) {
				if (condition[i]) {
					conditionString += (i + "=" + condition[i] + "&");
				}
			}
			var requestUrl = "https://www.zhaobaodong.space/exportForm?&" + conditionString + conditionListString;
			console.log("最终生成报表时候所请求的url是：", requestUrl);
			$http.get(requestUrl)
				.success(function(data) {
					if (data){
					var	option = {
							title: {
								text: $scope.condition.workShopId,
								subtext: '海源云数据平台'
							},
							tooltip: {
								trigger: 'axis'
							},
							legend: {
								data: ['最高气温', '最低气温']
							},
							toolbox: {
								show: true,
								feature: {
									dataZoom: {},
									dataView: {
										readOnly: false
									},
									magicType: {
										type: ['line', 'bar']
									},
									restore: {},
									saveAsImage: {}
								}
							},
							xAxis: {
								type: 'category',
								boundaryGap: false,
								data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
							},
							yAxis: {
								type: 'value',
								axisLabel: {
									formatter: '{value} °C'
								}
							},
							series: [{
								name: '最高气温',
								type: 'line',
								data: [11, 11, 15, 13, 12, 13, 10],
								markPoint: {
									data: [{
										type: 'max',
										name: '最大值'
									}, {
										type: 'min',
										name: '最小值'
									}]
								},
								markLine: {
									data: [{
										type: 'average',
										name: '平均值'
									}]
								}
							}, {
								name: '最低气温',
								type: 'line',
								data: [1, -2, 2, 5, 3, 2, 0],
								markPoint: {
									data: [{
										name: '周最低',
										value: -2,
										xAxis: 1,
										yAxis: -1.5
									}]
								},
								markLine: {
									data: [{
										type: 'average',
										name: '平均值'
									}]
								}
							}]
						};

						var myChart = echarts.init(document.getElementById('main'));
						myChart.setOption(option);
						console.log("服务端返回的data数据为：", data);
					}
				})
				.error(function(data) {
					alert("生成报表时发生了网络错误！")
				});
		}
	}

});