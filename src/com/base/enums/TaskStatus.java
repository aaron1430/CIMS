package com.base.enums;

/**
 * 任务状态
 * 
 * @author zjn
 * @date 2016年9月13日
 */
public enum TaskStatus {

	waitingReceipt(0), dealing(1), accomplish(2);

	public int value;

	private TaskStatus(int value) {
		this.value = value;
	}

}