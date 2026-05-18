package dev.alro127.tasksense;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"aws.region=us-east-1",
		"aws.access-key=test-access-key",
		"aws.secret-key=test-secret-key",
		"aws.bucket=test-bucket",
		"aws.endpoint=http://localhost:9000",
		"security.jwt.secret=test-secret-for-context-load"
})
class TaskSenseApplicationTests {

	@Test
	void contextLoads() {
	}

}
