package dev.alro127.tasksense;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class TaskSenseApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		System.setProperty("user.timezone", "Asia/Ho_Chi_Minh");
//		System.out.println("JVM TZ = " + TimeZone.getDefault().getID());
		SpringApplication.run(TaskSenseApplication.class, args);
	}

}
