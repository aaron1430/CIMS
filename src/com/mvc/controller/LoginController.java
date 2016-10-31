package com.mvc.controller;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.base.constants.CookieKeyConstants;
import com.base.constants.PageNameConstants;
import com.base.constants.PermissionConstants;
import com.base.constants.SessionKeyConstants;
import com.mvc.entity.AlarmStatistic;
import com.mvc.entity.User;
import com.mvc.service.AlarmService;
import com.mvc.service.AlarmStatisticService;
import com.mvc.service.InvoiceService;
import com.mvc.service.TaskService;
import com.mvc.service.UserService;
import com.utils.CookieUtil;
import com.utils.HttpRedirectUtil;

import net.sf.json.JSONObject;

/**
 * 登陆
 * 
 * @author zjn
 * @date 2016年9月7日
 */

@Controller
@RequestMapping("/login")
public class LoginController {
	@Autowired
	UserService userService;
	@Autowired
	InvoiceService invoiceService;
	@Autowired
	TaskService taskService;
	@Autowired
	AlarmService alarmService;
	@Autowired
	AlarmStatisticService alarmStatisticService;

	/**
	 * 加载默认起始页
	 * 
	 * @return
	 */
	@RequestMapping("/toLoginPage.do")
	public String contractInformationPage() {
		return "login";
	}

	/**
	 * 跳转到起始页
	 * 
	 * @return
	 */
	@RequestMapping("/toIndex.do")
	public String name() {
		return "index";
	}

	/**
	 * 检查该用户是否存在
	 * 
	 * @param request
	 * @param session
	 * @param map
	 * @return
	 */
	@RequestMapping("/checkUserName.do")
	public @ResponseBody Long checkUserName(HttpServletRequest request, HttpSession session, ModelMap map) {
		String userNum = request.getParameter("userName");
		Long result = userService.isExist(userNum);
		return result;
	}

	// @RequestMapping("/getUserPermission.do")
	// public @ResponseBody JSONObject getUserPermission(HttpServletRequest
	// request, HttpSession session, ModelMap map) {
	// JSONObject jsonObject = new JSONObject();
	// jsonObject.put("permission", "zhuren");
	// return jsonObject;
	// }

	/**
	 * 登录验证用户名和密码是否正确
	 * 
	 * @param session
	 * @param request
	 * @param model
	 * @param res
	 * @return
	 */
	@RequestMapping("/loginValidate.do")
	public @ResponseBody JSONObject loginValidate(HttpSession session, HttpServletRequest request, ModelMap model,
			HttpServletResponse res) {
		String userNum = request.getParameter("userName");
		String passWord = request.getParameter("password");
		User user = userService.findByUserNum(userNum);
		JSONObject jsonObject = new JSONObject();

		if (user != null) {
			String passwd = user.getUser_pwd();
			if (passwd != null && passwd.equals(passWord)) {
				jsonObject.put("err_message", "OK");
			} else {
				jsonObject.put("err_message", "err_password");
			}
		} else {
			jsonObject.put("err_message", "err_user");
		}
		return jsonObject;
	}

	/**
	 * 验证登陆之后写入Cookie和Session
	 * 
	 * @param session
	 * @param request
	 * @param model
	 * @param res
	 * @return
	 */
	@RequestMapping("/login.do")
	public String login(HttpSession session, HttpServletRequest request, ModelMap model, HttpServletResponse res) {
		String error_msg = "";
		String userNum = request.getParameter("userName");
		String password = request.getParameter("password");
		String isRemember = request.getParameter("isRemember"); // 记住密码//值获取不到
		User user = userService.findByUserNum(userNum);

		System.out.println("权限测试开始：");
		String result = "";
		String permission = user.getRole().getRole_permission();
		String[] strArr = null;
		JSONObject jsonObject = JSONObject.fromObject(permission);
		strArr = StringToArray(jsonObject.getString("con_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("task_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("bill_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("system_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("alarm_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result + " ");
		System.out.println("权限测试结束");

		CookieUtil cookie_u = new CookieUtil();
		if (user != null) { // 用户存在
			String passwd = user.getUser_pwd();
			if (passwd != null && passwd.equals(password)) {
				session.setAttribute(SessionKeyConstants.LOGIN, user);
				model.addAttribute("user", user);
				cookie_u.add_cookie(CookieKeyConstants.USERNAME, userNum, res, 60 * 60 * 24 * 15);
				if (isRemember != null) {
					cookie_u.add_cookie(CookieKeyConstants.PASSWORD, password, res, 60 * 60 * 24 * 7);
				} else {
					cookie_u.del_cookie(CookieKeyConstants.PASSWORD, request, res);
				}
				model.addAttribute("password", password);
				Cookie cookie = new Cookie("userNum", userNum);
				cookie.setMaxAge(30 * 60);
				cookie.setPath("/");
				res.addCookie(cookie);
				cookie = new Cookie("role", user.getRole().getRole_id().toString());
				cookie.setMaxAge(30 * 60);
				cookie.setPath("/");
				res.addCookie(cookie);
				return "index";// 返回到index主页
			} else { // 密码错误
				error_msg = "err_password";
				cookie_u.del_cookie(CookieKeyConstants.PASSWORD, request, res);
				model.addAttribute("error", error_msg);
				return HttpRedirectUtil.redirectStr(PageNameConstants.TOLOGIN);
			}
		} else { // 用户不存在
			error_msg = "err_user";
			model.addAttribute("error", error_msg);
			return HttpRedirectUtil.redirectStr(PageNameConstants.TOLOGIN);
		}
	}

	/**
	 * 退出登录
	 * 
	 * @param session
	 * @return
	 */
	@RequestMapping("/logout.do")
	public String logout(HttpSession session, HttpServletResponse response) {
		session.removeAttribute(SessionKeyConstants.LOGIN);
		Cookie cookie = new Cookie("userNum", null);
		cookie.setMaxAge(30 * 60);
		cookie.setPath("/");
		response.addCookie(cookie);
		return HttpRedirectUtil.redirectStr(PageNameConstants.TOLOGIN);
	}

	@RequestMapping(value = "/getUserFromSession.do")
	public @ResponseBody String getUserFromSession(HttpServletRequest request, HttpSession session) {
		JSONObject jsonObject = new JSONObject();
		User user = (User) session.getAttribute(SessionKeyConstants.LOGIN);
		jsonObject.put("user", user);
		return jsonObject.toString();
	}

	/**
	 * 初始化首页的数据
	 * 
	 * @param request
	 * @param session
	 * @return
	 */
	@RequestMapping(value = "/getInitData.do")
	public @ResponseBody String getInitData(HttpServletRequest request, HttpSession session) {
		JSONObject jsonObject = new JSONObject();
		User user = (User) session.getAttribute(SessionKeyConstants.LOGIN);
		if (user != null) {
			AlarmStatistic alarmStatistic = alarmStatisticService.findAlst(user.getUser_id());
			if (alarmStatistic.getTotal_receive_task_num() == null) {
				jsonObject.put("totalReceiveTaskNum", 0);
			} else {
				jsonObject.put("totalReceiveTaskNum", alarmStatistic.getTotal_receive_task_num());
			}
			if (alarmStatistic.getWait_audit_bill_task_num() == null) {
				jsonObject.put("waitAuditBillTaskNum", 0);
			} else {
				jsonObject.put("waitAuditBillTaskNum", alarmStatistic.getWait_audit_bill_task_num());
			}
			if (alarmStatistic.getAssistant_task_num() == null) {
				jsonObject.put("assistantTaskNum", 0);
			} else {
				jsonObject.put("assistantTaskNum", alarmStatistic.getAssistant_task_num());
			}
			if (alarmStatistic.getManager_control_task_num() == null) {
				jsonObject.put("managerControlTaskNum", 0);
			} else {
				jsonObject.put("managerControlTaskNum", alarmStatistic.getManager_control_task_num());
			}
			if (alarmStatistic.getBill_task_num() == null) {
				jsonObject.put("billTaskNum", 0);
			} else {
				jsonObject.put("billTaskNum", alarmStatistic.getBill_task_num());
			}
			if (alarmStatistic.getOther_task_num() == null) {
				jsonObject.put("otherTaskNum", 0);
			} else {
				jsonObject.put("otherTaskNum", alarmStatistic.getOther_task_num());
			}
			if (alarmStatistic.getDebt_alarm_num() == null) {
				jsonObject.put("debtAlarmNum", 0);
			} else {
				jsonObject.put("debtAlarmNum", alarmStatistic.getDebt_alarm_num());
			}
			if (alarmStatistic.getOverdue_alarm_num() == null) {
				jsonObject.put("overdueAlarmNum", 0);
			} else {
				jsonObject.put("overdueAlarmNum", alarmStatistic.getOverdue_alarm_num());
			}
			if (alarmStatistic.getTask_alarm_num() == null) {
				jsonObject.put("taskAlarmNum", 0);
			} else {
				jsonObject.put("taskAlarmNum", alarmStatistic.getTask_alarm_num());
			}
		}
		return jsonObject.toString();
	}

	/**
	 * 获取当前用户权限
	 * 
	 * @param request
	 * @param session
	 * @return
	 */
	@RequestMapping(value = "/getUserPermission.do")
	public @ResponseBody String getUserPermission(HttpServletRequest request, HttpSession session) {
		String result = "";
		User user = (User) session.getAttribute(SessionKeyConstants.LOGIN);
		String permission = user.getRole().getRole_permission();
		String[] strArr = null;
		JSONObject jsonObject = JSONObject.fromObject(permission);
		strArr = StringToArray(jsonObject.getString("con_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("task_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("bill_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("system_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result);
		strArr = StringToArray(jsonObject.getString("alarm_per"));
		for (int i = 0; i < strArr.length; i++) {
			if (strArr[i].equals("1")) {
				result += " " + PermissionConstants.contPer[i];
			}
		}
		System.out.println(result + " ");
		return JSON.toJSONString(result + " ");
	}

	private static String[] StringToArray(String str) {
		String subStr = str.substring(1, str.length() - 1);
		String strArr[] = subStr.split(",");
		return strArr;

	}
}
