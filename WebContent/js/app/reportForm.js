var app = angular
		.module(
				'reportForm',
				[ 'ngRoute' ],
				function($httpProvider) {// ngRoute引入路由依赖
					$httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded';
					$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

					// Override $http service's default transformRequest
					$httpProvider.defaults.transformRequest = [ function(data) {
						/**
						 * The workhorse; converts an object to
						 * x-www-form-urlencoded serialization.
						 * 
						 * @param {Object}
						 *            obj
						 * @return {String}
						 */
						var param = function(obj) {
							var query = '';
							var name, value, fullSubName, subName, subValue, innerObj, i;

							for (name in obj) {
								value = obj[name];

								if (value instanceof Array) {
									for (i = 0; i < value.length; ++i) {
										subValue = value[i];
										fullSubName = name + '[' + i + ']';
										innerObj = {};
										innerObj[fullSubName] = subValue;
										query += param(innerObj) + '&';
									}
								} else if (value instanceof Object) {
									for (subName in value) {
										subValue = value[subName];
										fullSubName = name + '[' + subName
												+ ']';
										innerObj = {};
										innerObj[fullSubName] = subValue;
										query += param(innerObj) + '&';
									}
								} else if (value !== undefined
										&& value !== null) {
									query += encodeURIComponent(name) + '='
											+ encodeURIComponent(value) + '&';
								}
							}

							return query.length ? query.substr(0,
									query.length - 1) : query;
						};

						return angular.isObject(data)
								&& String(data) !== '[object File]' ? param(data)
								: data;
					} ];
				});
// 获取权限列表
var permissionList;
angular.element(document).ready(function() {
	console.log("获取权限列表！");
	$.get('/CIMS/login/getUserPermission.do', function(data) {
		permissionList = data; // 
		console.log("身份是：" + permissionList);
		angular.bootstrap($("#reportForm"), [ 'reportForm' ]); // 手动加载angular模块
	});
});
app.run([ '$rootScope', '$location', function($rootScope, $location) {
	$rootScope.$on('$routeChangeSuccess', function(evt, next, previous) {
		console.log('路由跳转成功');
		$rootScope.$broadcast('reGetData');
	});
} ]);

// 路由配置
app.config([ '$routeProvider', function($routeProvider) {
	$routeProvider.when('/remoAnalyzeList', {
		templateUrl : '/CIMS/jsp/reportForm/remoAnalyzeList.html',
		controller : 'ReportController'
	}).when('/projectList', {
		templateUrl : '/CIMS/jsp/reportForm/projectList.html',
		controller : 'ReportController'
	}).when('/unGetContList', {
		templateUrl : '/CIMS/jsp/reportForm/unGetContList.html',
		controller : 'ReportController'
	})
} ]);
app.constant('baseUrl', '/CIMS/');
app.factory('services', [ '$http', 'baseUrl', function($http, baseUrl) {
	var services = {};

	// zq从设计部取出项目经理人选zq2016-11-17
	services.selectUsersFromDesign = function(data) {
		return $http({
			method : 'post',
			url : baseUrl + 'user/selectUsersFromDesign.do',
			data : data
		});
	};
	// 根据限制条件查询项目统计表zq2016-11-17
	services.selectProjectListBylimits = function(data) {
		return $http({
			method : 'post',
			url : baseUrl + 'reportForm/selectProjectListBylimits.do',
			data : data
		});
	};

	// 根据年份获取合同额到款分析表的数据
	services.getRemoAnalyzeDataByYear = function(data) {
		return $http({
			method : 'post',
			url : baseUrl + 'reportForm/selectComoRemoAnalyse.do',
			data : data
		});
	};

	// zq获取所有用户2016-11-18
	services.getAllUsers = function() {
		return $http({
			method : 'post',
			url : baseUrl + 'user/getAllUserList.do',
		});
	};
	// zq根据限制条件查询未返回项目统计表2016-11-18
	services.selectUnGetContListBylimits = function(data) {
		return $http({
			method : 'post',
			url : baseUrl + 'reportForm/selectUnGetContListBylimits.do',
			data : data
		});
	};

	services.outputComoCompareRemo = function(data) {
		return $http({
			method : 'post',
			url : baseUrl + 'reportForm/exportWord.do',
			data : data
		});
	}
	return services;
} ]);
app
		.controller(
				'ReportController',
				[
						'$scope',
						'services',
						'$location',
						function($scope, services, $location) {
							var reportForm = $scope;
							// zq2016-11-17
							var reportPage = 1;
							// zq查询条件实体2016-11-17
							var proListLimits = {};
							// zq设定查询条件初始值2016-11-17
							reportForm.limit = {
								contType : "-1",
								proStage : "",
								contStatus : "",
								province : "",
								startDate : "",
								endDate : "",
								userId : ""
							};
							// zq设定查询未返回合同查询条件初始值2016-11-18
							reportForm.unGetlimit = {
								province : "",
								startDate : "",
								endDate : "",
								userId : ""
							};
							// zq点击查询list2016-11-17
							reportForm.selectProjectListBylimits = function() {
								var errorText = $("#errorText").css("display");
								if (errorText == "inline") {
									alert("时间格式错误！");
									return false;
								}
								if (reportForm.limit.startDate != "") {
									if (reportForm.limit.endDate == "") {
										alert("请输入截止时间！");
										return false;
									} else {
										var date1 = new Date(
												reportForm.limit.startDate);
										var date2 = new Date(
												reportForm.limit.endDate);
										if (date1.getTime() > date2.getTime()) {
											alert("截止时间不能大于起始时间！");
											return false;
										}
									}
								}
								proListLimits = JSON
										.stringify(reportForm.limit);
								services.selectProjectListBylimits({
									limit : proListLimits,
									page : 1
								}).success(function(data) {
									reportForm.prStForms = data.list;// prstForms查询出来的列表（ProjectStatisticForm）
									pageTurn(data.totalPage, 1);
								});

							}
							// zq换页查找函数2016-11-17
							function findProjectListBylimits(p) {
								services.selectProjectListBylimits({
									limit : proListLimits,
									page : p
								}).success(function(data) {
									reportForm.prStForms = data.list;// prstForms查询出来的列表（ProjectStatisticForm）
								});
							}
							// zq：从设计部查找人员2016-11-17
							function selectUsersFromDesign() {
								services.selectUsersFromDesign({}).success(
										function(data) {
											reportForm.userDepts = data.list;
										});
							}
							// zq换页2016-11-17
							function pageTurn(totalPage, page) {
								var $pages = $(".tcdPageCode");
								if ($pages.length != 0) {
									$(".tcdPageCode").createPage({
										pageCount : totalPage,
										current : page,
										backFn : function(p) {
											reportPage = p;
											findProjectListBylimits(p);
										}
									});
								}
							}
							// liu
							reportForm.getTableDate = function() {
								var beginYear = $('#begin-year').val();
								var endYear = $('#end-year').val();
								if (!(/^\d{4}$/.test(beginYear) && /^\d{4}$/
										.test(endYear))) {
									alert("输入格式错误");
									return false;
								}
								services
										.getRemoAnalyzeDataByYear({
											beginYear : beginYear,
											endYear : endYear
										})
										.success(
												function(data) {
													// 表1
													reportForm.comoCompareRemo = data.comoCompareRemo;
													reportForm.newComoAnalyseList = data.newComoAnalyseList;
													console.log(reportForm.newComoAnalyseList);
													reportForm.table1Show = false;
													reportForm.table2Show = false;
													if (reportForm.comoCompareRemo) {
														reportForm.table1Show = true;
													}
													if (reportForm.newComoAnalyseList) {
														reportForm.table2Show = true;
													}
													var chart1Data = [];
													var chart2Data = [];
													for(var i=0;i<reportForm.newComoAnalyseList.length;i++){
														var arr1 = [];
														var arr2 = [];
														arr1[0] = reportForm.newComoAnalyseList[i].province;
														arr2[0] = reportForm.newComoAnalyseList[i].province;
														if(reportForm.newComoAnalyseList[i].como_one){
															arr1[1] = +reportForm.newComoAnalyseList[i].como_one;
														}
														else arr1[1] = 0;
														if(reportForm.newComoAnalyseList[i].como_two){
															arr2[1] = +reportForm.newComoAnalyseList[i].como_two;
														}
														else arr2[1] = 0;
														chart1Data[i] = arr1;
														chart2Data[i] = arr2;
													}
													
													console.log(chart2Data);
														
													Highcharts
															.wrap(
																	Highcharts.Chart.prototype,
																	'getSVG',
																	function(
																			proceed) {
																		return proceed
																				.call(
																						this)
																				.replace(
																						/(fill|stroke)="rgba([ 0-9]+,[ 0-9]+,[ 0-9]+),([ 0-9\.]+)"/g,
																						'$1="rgb($2)" $1-opacity="$3"');
																	});
													if (chart1Data) {
														var chart1 = new Chart(
																{
																	elementId : "#pieChart1",
																	title : beginYear
																			+ "年自营项目新签合同额分析图（单位：万元）",
																	name : "合同占比",
																	data : chart1Data
																});
														chart1.init();
														$('#chart1-svg')
																.val(
																		$(
																				"#pieChart1")
																				.highcharts()
																				.getSVG());
													}
													if (chart2Data) {
														var chart2 = new Chart(
																{
																	elementId : "#pieChart2",
																	title : endYear
																			+ "年自营项目新签合同额分析图（单位：万元）",
																	name : "合同占比",
																	data : chart2Data
																});
														chart2.init();
														$('#chart2-svg')
																.val(
																		$(
																				"#pieChart2")
																				.highcharts()
																				.getSVG());
													}
													// if(chart2Data){
													// var chart2 = new Chart(
													// {
													// elementId : "#pieChart2",
													// title :
													// "2014年自营项目新签合同额分析图",
													// name : "浏览器",
													// data : chart1Data
													// });
													// chart2.init();
													// $('#chart2-svg').val($("#pieChart2").highcharts().getSVG());
													// }
													// if(chart3Data){
													// var chart3 = new Chart(
													// {
													// elementId : "#pieChart3",
													// title :
													// "2014年自营项目新签合同额分析图",
													// name : "浏览器",
													// data : chart1Data
													// });
													// chart3.init();
													// $('#chart3-svg').val($("#pieChart3").highcharts().getSVG());
													// }

												});

							}
							reportForm.outputComoCompareRemo = function(e) {
								preventDefault(e);
								services.outputComoCompareRemo({
									beginYear : $('#begin-year').val(),
									endYear : $('#end-year').val(),
									chart1SVGStr : $('#chart1-svg').val(),
									chart2SVGStr : $('#chart2-svg').val(),
									chart3SVGStr : $('#chart3-svg').val(),
								}).success(function() {
									alert("导出成功！")
								});

							}
							function preventDefault(e) {
								if (e && e.preventDefault) {
									// 阻止默认浏览器动作(W3C)
									e.preventDefault();
								} else {
									// IE中阻止函数器默认动作的方式
									window.event.returnValue = false;
									return false;
								}
							}

							/*
							 * zq 2016-11-18未返回合同表
							 */
							// zq查找所有用户2016-11-18
							function selectAllUsers() {
								services.getAllUsers().success(function(data) {
									reportForm.users = data;
								});
							}
							// zq点击查询list2016-11-17
							reportForm.selectUnGetContListBylimits = function() {
								var errorText = $("#errorText").css("display");
								if (errorText == "inline") {
									alert("时间格式错误！");
									return false;
								}
								if (reportForm.unGetlimit.startDate != "") {
									if (reportForm.unGetlimit.endDate == "") {
										alert("请输入截止时间！");
										return false;
									} else {
										var date1 = new Date(
												reportForm.unGetlimit.startDate);
										var date2 = new Date(
												reportForm.unGetlimit.endDate);
										if (date1.getTime() > date2.getTime()) {
											alert("截止时间不能大于起始时间！");
											return false;
										}
									}
								}
								unGetListLimits = JSON
										.stringify(reportForm.unGetlimit);
								services.selectUnGetContListBylimits({
									limit : unGetListLimits,
									page : 1
								}).success(function(data) {
									reportForm.unGetContForms = data.list;
									unGetPageTurn(data.totalPage, 1);
									if (data.list.length) {
										reportForm.listIsShow = false;
									} else {
										reportForm.listIsShow = true;
									}
								});
							}
							// zq换页查找函数2016-11-18
							function findUnGetContListBylimits(p) {
								services.selectUnGetContListBylimits({
									limit : unGetListLimits,
									page : p
								}).success(function(data) {
									reportForm.unGetContForms = data.list;// prstForms查询出来的列表（ProjectStatisticForm）
									if (data.list.length) {
										reportForm.listIsShow = false;
									} else {
										reportForm.listIsShow = true;
									}
								});
							}
							// zq换页2016-11-18
							function unGetPageTurn(totalPage, page) {
								var $pages = $(".tcdPageCode");
								if ($pages.length != 0) {
									$(".tcdPageCode").createPage({
										pageCount : totalPage,
										current : page,
										backFn : function(p) {
											findUnGetContListBylimits(p);
										}
									});
								}
							}

							// 初始化
							function initData() {
								console.log("初始化页面信息");
								if ($location.path()
										.indexOf('/remoAnalyzeList') == 0) {
									var date = new Date();
									var year = date.getFullYear();
									$('#begin-year').val(year);
									$('#end-year').val(year);
								} else if ($location.path().indexOf(
										'/projectList') == 0) {
									reportForm.listIsShow = false;
									selectUsersFromDesign();
								} else if ($location.path().indexOf(
										'/unGetContList') == 0) {
									reportForm.listIsShow = false;
									selectAllUsers();
								}
							}
							initData();
							// zq控制年月2016-11-17
							var $dateFormat = $(".dateFormatForYM");
							var dateRegexpForYM = /^[0-9]{4}-[0-9]{1,2}$/;
							$(".dateFormatForYM").blur(
									function() {
										if (this.value.trim() != "") {
											if (!dateRegexpForYM
													.test(this.value)) {
												$(this).parent().children(
														"span").css('display',
														'inline');
											} else {
												var month = parseInt(this.value
														.split("-")[1]);
												if (month > 12) {
													$(this).parent().children(
															"span")
															.css('display',
																	'inline');
												}
											}
										}
									});
							$(".dateFormatForYM").click(
									function() {
										$(this).parent().children("span").css(
												'display', 'none');
									});
						} ]);
// 截取任务内容zq2016-11-17
app.filter('cutString', function() {
	return function(input) {
		var content = "";
		if (input != "") {
			var shortInput = input.substr(0, 10);
			content = shortInput + "……";
		}

		return content;
	}
});
// 小数过滤器zq2016-11-17
app.filter('numberFloat', function() {
	var money = 0.00;
	return function(input) {
		if (input) {
			money = parseFloat(input).toFixed(2);
		}
		return money;
	}
});

// 时间的格式化的判断
app.filter('dateType', function() {
	return function(input) {
		var type = "";
		if (input) {
			type = new Date(input).toLocaleDateString().replace(/\//g, '-');
		}

		return type;
	}
});

// 年份
app.filter('bYear', function() {
	return function() {
		return $('#begin-year').val();
	}
});
app.filter('eYear', function() {
	return function() {
		return $('#end-year').val();
	}
});
app.filter('nYear', function() {
	return function() {
		return +$('#end-year').val() + 1;
	}
});
