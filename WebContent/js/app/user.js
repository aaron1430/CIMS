var app = angular
		.module(
				'user',
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

app.run([ '$rootScope', '$location', function($rootScope, $location) {
	$rootScope.$on('$routeChangeSuccess', function(evt, next, previous) {
		console.log('路由跳转成功');
		$rootScope.$broadcast('reGetData');
	});
} ]);

// 路由配置
app.config([ '$routeProvider', function($routeProvider) {
	$routeProvider.when('/roleAdd', {
		templateUrl : '/CIMS/jsp/systemManagement/roleAdd.html',
		controller : 'userController'
	}).when('/roleList', {
		templateUrl : '/CIMS/jsp/systemManagement/roleList.html',
		controller : 'userController'
	}).when('/userList', {
		templateUrl : '/CIMS/jsp/systemManagement/userList.html',
		controller : 'userController'
	});
} ]);
app.constant('baseUrl', '/CIMS/');
app.factory('services', [ '$http', 'baseUrl', function($http, baseUrl) {
	var services = {};
	services.getUserListByPage = function(data) {
		console.log("发送请求根据页数获取用户信息");
		return $http({
			method : 'post',
			url : baseUrl + 'user/getUserListByPage.do',
			data : data
		});
	};

	services.getAllDepartmentList = function(data) {
		console.log("发送请求获取所有部门信息");
		return $http({
			method : 'post',
			url : baseUrl + 'department/getAllDepartmentList.do',
			data : data
		});
	};

	services.addUser = function(data) {
		console.log("发送请求增加用户信息");

		return $http({
			method : 'post',
			url : baseUrl + 'user/addUser.do',
			data : data
		});
	};
	services.deleteUser = function(data) {
		console.log("发送请求删除用户信息");
		return $http({
			method : 'post',
			url : baseUrl + 'user/deleteUser.do',
			data : data
		});
	};

	services.selectUserByName = function(data) {
		console.log("按名字查找用户");
		return $http({
			method : 'post',
			url : baseUrl + 'user/selectUserByName.do',
			data : data
		});
	};
	services.selectUserById = function(data) {
		console.log("按名字查找用户");
		return $http({
			method : 'post',
			url : baseUrl + 'user/selectUserById.do',
			data : data
		});
	};
	services.getRoleListByPage = function(data) {
		console.log("发送请求根据页数获取角色信息");
		return $http({
			method : 'post',
			url : baseUrl + 'role/getRoleListByPage.do',
			data : data
		});
	};

	services.deleteRole = function(data) {
		console.log("发送请求删除角色信息");
		return $http({
			method : 'post',
			url : baseUrl + 'role/deleteRole.do',
			data : data
		});
	};
	services.getAllRoleList = function(data) {
		console.log("发送请求获取所有角色信息");
		return $http({
			method : 'post',
			url : baseUrl + 'role/getAllRoleList.do',
			data : data
		});
	};
	services.addRole = function(data) {
		console.log("发送请求添加角色");
		return $http({
			method : 'post',
			url : baseUrl + 'role/addRole.do',
			data : data
		});

	};
	services.selectRoleById = function(data) {
		console.log("发送请求获取role");
		return $http({
			method : 'post',
			url : baseUrl + 'role/selectRoleById.do',
			data : data
		});
	};
	return services;
} ]);

app.controller('userController', [
		'$scope',
		'services',
		'$location',
		function($scope, services, $location) {

			var user = $scope;
			// 换页
			function pageTurn(totalPage, page) {

				var $pages = $(".tcdPageCode");
				console.log($pages.length);
				if ($pages.length != 0) {
					$(".tcdPageCode").createPage({
						pageCount : totalPage,
						current : page,
						backFn : function(p) {
							getDepartmentListByPage(p)
						}
					});
				}
			}
			// 根据页数获取用户列表
			function getUserListByPage(page) {
				services.getUserListByPage({
					page : page
				}).success(function(data) {
					user.users = data.list;
				});
			}
			// 功能模块权限字段名
			var perName = [ "con_per", "task_per", "bill_per", "system_per",
					"alarm_per" ];
			// 初始化权限数据容器
			function initCheckBoxData() {
				$("input:checkbox[name='selectAllChkBx']").attr("checked",
						false);

				user.selected = {};
				for (var i = 0; i < 5; i++) {
					user.selected[perName[i]] = new Array();
					for (var j = 0; j < 12; j++)
						user.selected[perName[i]][j] = 0;
				}
			}
			// 根据用户选择更新权限数据容器
			var updateSelected = function(action, id, name) {
				if (action == 'add') {
					user.selected[id][name] = 1;
				}
				if (action == 'remove') {
					user.selected[id][name] = 0;
				}
			}
			user.selectAll = function($event, subPerName) {
				if ($event.target.checked == true) {
					for (var i = 0; i < 10; i++)
						user.selected[subPerName][i] = 1;
				} else {
					for (var i = 0; i < 10; i++)
						user.selected[subPerName][i] = 0;
				}

			}
			// 根据用户选择更新权限数据容器
			user.updateSelection = function($event, id) {
				var checkbox = $event.target;
				var action = (checkbox.checked ? 'add' : 'remove');
				updateSelected(action, checkbox.id, checkbox.name);
			}
			// 控件内容初始化
			user.isSelected = function(id, name) {
				var t = user.selected[id][name];
				return t;
			}

			// 用户模态框开始
			// 点击新建按钮事件
			user.addNewUser = function() {
				services.getAllRoleList().success(function(data) {
					user.roles = data;
					console.log(data);
				});
				$(".overlayer").fadeIn(200);
				$(".tip").fadeIn(200);
				$("#addUser-form").slideDown(200);
				$("#editUser-form").hide();
			};

			// 点击修改时弹出模态框
			user.editUserBtn = function(obj) {
				var user_id = this.user.user_id;
				services.getAllRoleList().success(function(data) {
					user.roles2 = data;
					console.log(data);
					services.selectUserById({
						userid : user_id
					}).success(function(data) {
						user.editUser = data.user;
						console.log(user_id);
					});
				});

				$(".overlayer").fadeIn(200);
				$(".tip").fadeIn(200);
				$("#addUser-form").hide();
				$("#editUser-form").slideDown(200);
				return false;
			};

			// 修改报用户
			$(".sure2").click(function() {
				var EditUser = JSON.stringify(user.editUser);
				console.log(EditUser);
				services.addUser({
					user : EditUser
				}).success(function(data) {
					alert("修改成功！");
					getUserListByPage(1);
				});

				$(".overlayer").fadeOut(100);
				$(".tip").fadeOut(100);
			});
			// 隐藏模态框
			$(".tiptop a").click(function() {
				$(".overlayer").fadeOut(200);
				$(".tip").fadeOut(200);
			});

			$(".cancel").click(function() {
				// sessionStorage.setItem("contractId", "");

				$(".overlayer").fadeOut(100);
				$(".tip").fadeOut(100);
			});
			// 添加用户
			$(".sure1").click(function() {
				var AddUser = JSON.stringify(user.addinguser);
				console.log(AddUser);
				services.addUser({
					user : AddUser
				}).success(function(data) {
					alert("新建成功！");
					getUserListByPage(1);
				});

				$(".overlayer").fadeOut(100);
				$(".tip").fadeOut(100);
			});
			// 模态框完

			// 角色模态框开始
			// 点击新建按钮事件
			user.addNewRole = function() {
				initCheckBoxData();
				$(".overlayer").fadeIn(200);
				$(".tip").fadeIn(200);
				$("#addRole-form").slideDown(200);
				$("#editRole-form").hide();
			};

			// 点击修改时弹出模态框
			user.editRoleBtn = function(obj) {
				var roleID = this.role.role_id;
				initCheckBoxData();
				services.selectRoleById({
					roleid : roleID
				}).success(function(data) {
					user.editRole = data.role;
					user.selected = $.parseJSON(data.role.role_permission);
					console.log(roleID);
				});
				$(".overlayer").fadeIn(200);
				$(".tip").fadeIn(200);
				$("#addRole-form").hide();
				$("#editRole-form").slideDown(200);
				$(".roleEdit").show();
				return false;
			};
			// 点击查看按钮时弹出模态框
			user.detailRoleBtn = function(obj) {
				var roleID = this.role.role_id;
				initCheckBoxData();
				services.selectRoleById({
					roleid : roleID
				}).success(function(data) {
					user.editRole = data.role;
					user.selected = $.parseJSON(data.role.role_permission);
					console.log(roleID);
				});
				$(".overlayer").fadeIn(200);
				$(".tip").fadeIn(200);
				$("#addRole-form").hide();
				$("#editRole-form").slideDown(200);
				$(".roleEdit").hide();
				return false;
			};
			// 修改角色
			$(".roleEdit").click(function() {
				var EditRole = JSON.stringify(user.editRole);
				var EditRolePermission = JSON.stringify(user.selected);
				console.log(EditRole);

				services.addRole({
					role_name : user.editRole.role_name,
					role_id : user.editRole.role_id,
					role_permission : EditRolePermission
				}).success(function(data) {
					alert("修改成功！");
					getRoleListByPage(1);
				});

				$(".overlayer").fadeOut(100);
				$(".tip").fadeOut(100);
			});
			// 隐藏模态框
			$(".tiptop a").click(function() {
				$(".overlayer").fadeOut(200);
				$(".tip").fadeOut(200);
			});

			$(".cancel").click(function() {
				// sessionStorage.setItem("contractId", "");

				$(".overlayer").fadeOut(100);
				$(".tip").fadeOut(100);
			});
			// 添加角色
			$(".roleAdd").click(function() {
				var AddUser = JSON.stringify(user.addinguser);
				var rolePermission = JSON.stringify(user.selected);
				console.log(AddUser);
				services.addRole({
					role_name : user.addingRole.role_name,
					role_permission : rolePermission
				}).success(function(data) {
					alert("新建成功！");
					getRoleListByPage(1);
				});

				$(".overlayer").fadeOut(100);
				$(".tip").fadeOut(100);
			});
			// 模态框完

			// 删除用户
			user.deleteUser = function(user_id) {
				if (confirm("是否删除该用户？") == true) {
					services.deleteUser({
						userId : user_id
					}).success(function(data) {

						user.result = data;
						if (data == "true") {
							console.log("删除用户列表成功！");
						} else {
							console.log("删除用户列表失败！");
						}
						initData();
					});
				}
			}
			// 根据页数获取角色列表
			function getRoleListByPage(page) {
				services.getRoleListByPage({
					page : page
				}).success(function(data) {
					user.roles = data.list;
				});
			}

			// 删除角色
			user.deleteRole = function(role_id) {

				if (confirm("确定删除该角色吗？")) {
					services.deleteRole({
						roleId : role_id
					}).success(function(data) {
						if (data == "true") {
							console.log("删除用户列表成功！");
						} else {
							console.log("删除用户列表失败！");
						}
						initData();
					});
				}
			}
			// 获取部门列表
			function getAllDepartmentList() {
				services.getAllDepartmentList({}).success(function(data) {
					console.log("获取部门列表成功！");
					user.departs = data;
				});
			}
			// 获取角色列表
			function getAllRoleList() {
				services.getAllRoleList({}).success(function(data) {
					console.log("获取角色列表成功！");
					user.roles = data;
				});
			}

			// 根据输入筛选用户
			user.selectUserByName = function() {
				services.selectUserByName({
					userName : $("#uName").val()
				}).success(function(data) {
					user.users = data;
				});
			};
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
					console.log(name);
					cookie[name.trim()] = value;
					console.log("进来了,已经赋值" + name);
					if (name.trim() == "role") {
						sessionStorage.setItem("userRole", value);
					}

				}
			}
			// 初始化
			function initData() {
				console.log("初始化页面信息");
				$("#alarm").hide();
				$("#user").show();
				if ($location.path().indexOf('/userList') == 0) {
					services.getUserListByPage({
						page : 1
					}).success(function(data) {
						user.users = data.list;
						pageTurn(data.totalPage, 1)
					});
				} else if ($location.path().indexOf('/userAdd') == 0) {
					console.log("初始化用户新增信息");

					getAllDepartmentList();
					getAllRoleList();

				} else if ($location.path().indexOf('/roleList') == 0) {
					initCheckBoxData();
					services.getRoleListByPage({
						page : 1
					}).success(function(data) {
						user.roles = data.list;
						pageTurn(data.totalPage, 1)
					});
				}
			}

			initData();
			findRoleFromCookie();
			$scope.$on('reGetData', function() {
				console.log("重新获取数据！");
				initData();
			});

		} ]);

app
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