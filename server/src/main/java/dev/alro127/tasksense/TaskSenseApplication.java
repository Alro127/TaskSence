package dev.alro127.tasksense;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class TaskSenseApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		System.setProperty("user.timezone", "Asia/Ho_Chi_Minh");
//		System.out.println("JVM TZ = " + TimeZone.getDefault().getID());
		SpringApplication.run(TaskSenseApplication.class, args);
	}

}
