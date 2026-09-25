package com.andreicorrealemos.card_management.card.controller;

import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CardCreateEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CardRepository cardRepository;

    @Test
    void createsCardReturns201AndRepositoryGeneratedId() throws Exception {
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(42L);
            return card;
        });

        mockMvc.perform(post("/api/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Example Sword",
                                  "description": "A simple sword.",
                                  "type": "WEAPON",
                                  "cost": 2,
                                  "attack": 0,
                                  "defense": null,
                                  "twoHanded": false
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/cards/42"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.attack").value(0))
                .andExpect(jsonPath("$.defense").value(nullValue()));

        verify(cardRepository).save(any(Card.class));
    }
}
