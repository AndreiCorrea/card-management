package com.andreicorrealemos.card_management;

import com.andreicorrealemos.card_management.card.repository.CardRepository;
import com.andreicorrealemos.card_management.card.service.CardService;
import com.andreicorrealemos.card_management.card.controller.CardController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class CardManagementApplicationTests {
	@Autowired
	private CardRepository cardRepository;
	@Autowired
	private CardService cardService;
	@Autowired
	private CardController cardController;

	@Test
	void contextLoads() {
		assertNotNull(cardRepository);
		assertNotNull(cardService);
		assertNotNull(cardController);
	}

}
