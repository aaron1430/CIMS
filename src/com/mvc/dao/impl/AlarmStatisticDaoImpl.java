package com.mvc.dao.impl;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Query;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import com.mvc.dao.AlarmStatisticDao;
import com.mvc.entity.AlarmStatistic;

/**
 * 报警统计持久层实现
 * 
 * @author wangrui
 * @date 2016-10-20
 */
@Repository("alarmStatisticDaoImpl")
public class AlarmStatisticDaoImpl implements AlarmStatisticDao {

	@Autowired
	@Qualifier("entityManagerFactory")
	EntityManagerFactory emf;

	// 报警统计
	@Override
	public AlarmStatistic findAlst(Integer user_id) {
		EntityManager em = emf.createEntityManager();
		StringBuilder sql = new StringBuilder();
		sql.append("select * from (select sum(case when task_state=0 then 1 else 0 end) total_receive_task_num,");// 当前用户接收的所有任务
		sql.append("sum(case when task_state=0 and task_type=1 then 1 else 0 end) assistant_task_num,");// 文书任务
		sql.append("sum(case when task_state=0 and task_type=2 then 1 else 0 end) manager_control_task_num,");// 执行管控任务
		sql.append("sum(case when task_state=0 and task_type=0 then 1 else 0 end) other_task_num ");// 普通任务
		sql.append(
				"from (select task_id,task_state,task_type from task where task_isdelete=0 and receiver_id=:user_id) as a) as aa,");
		sql.append("(select sum(case when invo_state=0 then 1 else 0 end) wait_audit_bill_task_num,");// 待审核发票任务
		sql.append("sum(case when invo_state=1 then 1 else 0 end) bill_task_num ");// 发票任务
		sql.append(
				"from (select invo_id,invo_state from invoice where invo_isdelete=0 and audit_id=:user_id) as b) as bb,");
		sql.append("(select sum(case when alar_code in(2,3)  then 1 else 0 end) debt_alarm_num,");// 收款超时
		sql.append("sum(case when alar_code in(4,5) then 1 else 0 end) overdue_alarm_num,");// 工程逾期
		sql.append("sum(case when alar_code=1 then 1 else 0 end) task_alarm_num ");// 任务超时
		sql.append(
				"from (select count(alar_id) as tmp_id,alar_code from alarm a where receiver_id=:user_id and alar_isremove=0 ");
		sql.append("group by task_id,reno_id,prst_id) as c) as cc,");
		sql.append("(select alst_id from alarm_statistic) as dd");
		Query query = em.createNativeQuery(sql.toString(), AlarmStatistic.class);
		query.setParameter("user_id", user_id);
		AlarmStatistic alarmStatistic = (AlarmStatistic) query.getSingleResult();
		em.close();
		return alarmStatistic;
	}

}
