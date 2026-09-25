package com.andreicorrealemos.card_management;

import com.andreicorrealemos.card_management.card.repository.CardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class CardManagementApplicationTests {
	@Autowired
	private CardRepository cardRepository;

	@Test
	void contextLoads() {
		assertNotNull(cardRepository);
	}

}
