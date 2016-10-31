var receiveMoneyApp = angular
		.module(
				'receiveMoney',
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

receiveMoneyApp.run([
		'$rootScope',
		'$location',
		function($rootScope, $location) {
			$rootScope.$on('$routeChangeSuccess',
					function(evt, next, previous) {
						console.log('路由跳转成功');
						/* $rootScope.$broadcast('reGetData'); */
					});
		} ]);

// 路由配置
receiveMoneyApp.config([ '$routeProvider', function($routeProvider) {
	$routeProvider.when('/receiveMoneyList', {
		templateUrl : '/CIMS/jsp/billInformation/receiveMoneyList.html',
		controller : 'ReceiveMoneyController'
	})
} ]);
receiveMoneyApp.constant('baseUrl', '/CIMS/');
receiveMoneyApp
		.factory(
				'receivemoneyservices',
				[
						'$http',
						'baseUrl',
						function($http, baseUrl) {
							var services = {};
							// zq根据ID查找合同信息
							services.selectContractById = function(data) {
								return $http({
									method : 'post',
									url : baseUrl
											+ 'contract/selectContractById.do',
									data : data
								});
							};
							// zq根据合同ID获取获取已到款钱数
							services.countReceiveMoneyByContId = function(data) {
								return $http({
									method : 'post',
									url : baseUrl
											+ 'receiveMoney/receiveMoneyByContId.do',
									data : data
								});
							};
							// 根据ID获取到款某条记录
							services.selectReceiveMoneyById = function(data) {
								return $http({
									method : 'post',
									url : baseUrl
											+ 'receiveMoney/selectReceiveMoneyById.do',
									data : data
								})
							};
							// 根据合同ID获取该合同的所有到款记录
							services.selectReceiveMoneysByContId = function(
									data) {
								return $http({
									method : 'post',
									url : baseUrl
											+ 'receiveMoney/selectReceiveMoneyByContId.do',
									data : data
								})
							};
							services.auditReceiveMoney = function(data) {
								return $http({
									method : 'post',
									url : baseUrl
											+ 'receiveMoney/auditReceiveMoney.do',
									data : data
								})
							};
							return services;
						} ]);

receiveMoneyApp
		.controller(
				'ReceiveMoneyController',
				[
						'$scope',
						'receivemoneyservices',
						'$location',
						function($scope, services, $location) {
							// 合同
							var reMoney = $scope;
							var role;
							var remoState = null;

							// 查看到款记录
							reMoney.checkRemo = function() {
								var remoId = this.remo.remo_id;
								selectReceiveMoneyById(remoId);
								$(".overlayer").fadeIn(200);
								$("#tipRemo").fadeIn(200);
								$(".tipbtn").hide();

							}

							// 审核到款记录
							reMoney.auditRemo = function() {
								var remoId = this.remo.remo_id;
								sessionStorage.setItem("remoId", remoId);
								selectReceiveMoneyById(remoId);
								$(".overlayer").fadeIn(200);
								$("#tipRemo").fadeIn(200);
								$(".auditE").show();
							};
							$("#cancelRemoAudit").click(function() {
								$("#tipRemo").fadeOut(100);
								$(".overlayer").fadeOut(200);
								reMoney.receiveMoney = "";
							});
							$("#sureRemoAudit").click(function() {
								services.auditReceiveMoney({
									remoId : sessionStorage.getItem("remoId"),
									remoAmoney : $("#remoAmoney").val()
								}).success(function(data) {
									alert("操作成功！");
									$("#tipRemo").fadeOut(100);
									$(".overlayer").fadeOut(200);
									reMoney.receiveMoney = "";
								});

							});
							// 根据到款ID查找到款单条记录
							function selectReceiveMoneyById(remoId) {
								services
										.selectReceiveMoneyById({
											remoId : remoId
										})
										.success(
												function(data) {
													reMoney.receiveMoney = data.receiveMoney;
													if (data.receiveMoney.remo_time != null) {
														reMoney.receiveMoney.remo_time = changeDateType(data.receiveMoney.remo_time.time);
													} else {
														reMoney.receiveMoney.remo_time = "";
													}

												});
							}
							// zq：读取合同的信息
							function selectContractById() {
								var contId = sessionStorage.getItem('conId');
								services.selectContractById({
									cont_id : contId
								}).success(function(data) {
									reMoney.cont = data;
								});
							}

							// zq：根据合同ID计算该合同目前共到款多少钱
							function countReceiveMoneyByContId() {
								var contId = sessionStorage.getItem('conId');
								services.countReceiveMoneyByContId({
									contId : contId
								}).success(function(data) {
									reMoney.totalMoney = data.totalMoney;
								});
							}
							// 更改任务时间的格式
							function changeDateType(time) {

								newDate = new Date(time).toLocaleDateString()
										.replace(/\//g, '-');
								return newDate;
							}
							function findRoleFromCookie() {
								var cookie = {};

								var cookies = document.cookie;
								if (cookies === "")
									return cookie;
								var list = cookies.split(";");
								for (var i = 0; i < list.length; i++) {
									var cookieString = list[i];
									/* console.log("cookie内容" + cookieString); */
									var p = cookieString.indexOf("=");
									var name = cookieString.substring(0, p);
									var value = cookieString.substring(p + 1,
											cookieString.length);

									cookie[name.trim()] = value;

									if (name.trim() == "role") {
										sessionStorage.setItem("userRole",
												value);
										role = value;
										switch (sessionStorage.getItem(
												'userRole').trim()) {
										case "1":

											break;
										case "2":

											break;
										case "3":

											break;
										case "4":

											break;
										case "5":

											break;
										}
									}

								}
							}
							// zq换页
							function pageTurn(totalPage, page) {
								var $pages = $(".tcdPageCode");
								console.log($pages.length);
								if ($pages.length != 0) {
									$(".tcdPageCode").createPage({
										pageCount : totalPage,
										current : page,
										backFn : function(p) {
											findReceiveMoneysByContId(p)
										}
									});
								}
							}
							// 用于翻页时调用查找函数
							function findReceiveMoneysByContId(p) {
								services.selectReceiveMoneysByContId({
									contId : sessionStorage.getItem("conId"),
									page : p,
									remoState : remoState
								}).success(function(data) {
									reMoney.remos = data.list;
									pageTurn(data.totalPage, 1);
								});
							}
							// 用于前台的查找
							reMoney.selectReceiveMoneysByContId = function() {
								remoState = $("#remoState").val();
								services.selectReceiveMoneysByContId({
									contId : sessionStorage.getItem("conId"),
									page : 1,
									remoState : remoState
								}).success(function(data) {
									reMoney.remos = data.list;
									pageTurn(data.totalPage, 1);
								});

							};
							// zq初始化页面信息
							function initData() {
								$(".tiptop a").click(function() {

									$(".overlayer").fadeOut(200);
									$(".tip").fadeOut(200);
								});
								$("#receiveMoney").show();
								$("#invoice").hide();
								$("#receipt").hide();
								$("#contract").hide();
								console.log("初始化页面信息");
								if ($location.path().indexOf(
										'/receiveMoneyList') == 0) {// 如果是合同列表页
									remoState = "-1";
									reMoney.remoState = "-1";
									selectContractById();
									countReceiveMoneyByContId();
									services.selectReceiveMoneysByContId(
											{
												contId : sessionStorage
														.getItem("conId"),
												page : 1,
												remoState : remoState
											}).success(function(data) {
										reMoney.remos = data.list;

										pageTurn(data.totalPage, 1);
									});
								}
							}
							function dateformat() {
								var $dateFormat = $(".dateFormat");
								var dateRegexp = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
								$(".dateFormat").blur(
										function() {
											if (!dateRegexp.test(this.value)) {
												$(this).parent().children(
														"span").css('display',
														'inline');
											}
										});
								$(".dateFormat").click(
										function() {
											$(this).parent().children("span")
													.css('display', 'none');
										});
							}
							findRoleFromCookie();
							initData();// 初始化

							dateformat();// 格式化日期格式
						} ]);

// 小数过滤器
receiveMoneyApp.filter('invoFloat', function() {
	return function(input) {
		if (input == null) {
			var money = parseFloat('0').toFixed(2);
		} else {
			var money = parseFloat(input).toFixed(2);
		}
		return money;
	}
});

// 时间的格式化的判断
receiveMoneyApp.filter('dateType', function() {
	return function(input) {
		var type = "";
		if (input != null) {
			type = new Date(input).toLocaleDateString().replace(/\//g, '-');
		}

		return type;
	}
});

// 小数过滤器
receiveMoneyApp.filter('receFloat', function() {
	return function(input) {
		var money = parseFloat(input).toFixed(2);
		return money;
	}
});
// 自定义表单验证日期格式
receiveMoneyApp.directive("dateFormat", function() {
	return {
		restrict : 'A',
		require : 'ngModel',
		scope : true,
		link : function(scope, elem, attrs, controller) {
			var dateRegexp = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
			// Model变化时执行
			// 初始化指令时BU执行
			scope.$watch(attrs.ngModel, function(val) {
				if (!val) {
					return;
				}
				if (!dateRegexp.test(val)) {
					controller.$setValidity('dateformat', false);
				} else {
					controller.$setValidity('dateformat', true);
				}
			});
		}
	}
});
// 截取任务内容
receiveMoneyApp.filter('cutString', function() {
	return function(input) {
		var content = "";
		if (input != "") {
			var shortInput = input.substr(0, 6);
			content = shortInput + "……";
		}

		return content;
	}
});
// 判断发票状态
receiveMoneyApp.filter('invoState', function() {
	return function(input) {
		var state = "";
		if (input == "0") {
			state = "待审核";
		}
		if (input == "1") {
			state = "待处理";
		}
		if (input == "2") {
			state = "已完成";
		}
		return state;
	}
});
receiveMoneyApp
		.directive(
				'hasPermission',
				function($timeout) {
					return {
						restrict : 'A',
						link : function(scope, element, attr) {

							var key = attr.hasPermission.trim(); // 获取页面上的权限值
							console.log("获取页面上的权限值" + key);
							/* console.log("cookie内容" + JSON.stringify(cookie)); */
							/*
							 * if (sessionStorage.getItem('userRole').trim() ==
							 * "3") { element.css("display", "none"); }
							 */
							switch (sessionStorage.getItem('userRole').trim()) {
							case "1":
								var keys1 = " cBodyEdit cPsAdd cPsEdit cPsDel cRnAdd cRnEdit cRnDel bReceAdd tContCollect tInvoFinish bInvoAdd cAdd cHeadEdit cDel cTaskAdd tInvoAudit tContDetail ";
								var regStr1 = "\\s" + key + "\\s";
								var reg1 = new RegExp(regStr1);
								if (keys1.search(reg1) < 0) {
									element.css("display", "none");
								}
								break;
							case "2":
								var keys2 = " tContDetail ";
								var regStr2 = "\\s" + key + "\\s";
								var reg2 = new RegExp(regStr2);
								if (keys2.search(reg2) < 0) {
									element.css("display", "none");
								}
								break;
							case "3":
								var keys3 = " cBodyEdit cPsAdd cPsEdit cPsDel cRnAdd cRnEdit cRnDel bReceAdd tContCollect tInvoFinish ";
								var regStr3 = "\\s" + key + "\\s";
								var reg3 = new RegExp(regStr3);
								if (keys3.search(reg3) < 0) {
									element.css("display", "none");
								}
								break;
							case "4":
								var keys4 = " bInvoAdd tContDetail ";
								var regStr4 = "\\s" + key + "\\s";
								var reg4 = new RegExp(regStr4);
								if (keys4.search(reg4) < 0) {
									element.css("display", "none");
								}
								break;
							case "5":
								var keys5 = " cAdd cHeadEdit cDel cTaskAdd tInvoAudit tContDetail ";
								var regStr5 = "\\s" + key + "\\s";
								var reg5 = new RegExp(regStr5);

								if (keys5.search(reg5) < 0) {
									element.css("display", "none");
								}
								break;
							}
						}
					};

				});
/*
 * app.directive('minLength', function () { return { restrict: 'A', require:
 * 'ngModel', scope: { 'min': '@' }, link: function (scope, ele, attrs,
 * controller) { scope.$watch(attrs.ngModel, function (val) { if (!val) {
 * return; } console.log(val); if (val.length <= scope.min) {
 * controller.$setValidity('minlength', false); } else {
 * controller.$setValidity('minlength', true); } }); } } });
 */