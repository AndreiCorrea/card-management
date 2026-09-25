package com.andreicorrealemos.card_management.card.controller;

import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.model.CardType;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CardListEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CardRepository cardRepository;

    @Test
    void returnsCardsWithIdsAndFieldsMapped() throws Exception {
        Card first = card(12L, "Example Sword");
        first.setAttack(0);
        first.setDefense(null);
        Card second = card(24L, "Example Shield");
        second.setDefense(3);
        when(cardRepository.findAll()).thenReturn(List.of(first, second));

        mockMvc.perform(get("/api/cards"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(12))
                .andExpect(jsonPath("$[0].name").value("Example Sword"))
                .andExpect(jsonPath("$[0].type").value("WEAPON"))
                .andExpect(jsonPath("$[0].attack").value(0))
                .andExpect(jsonPath("$[0].defense").value(nullValue()))
                .andExpect(jsonPath("$[1].id").value(24))
                .andExpect(jsonPath("$[1].name").value("Example Shield"))
                .andExpect(jsonPath("$[1].defense").value(3));

        verify(cardRepository).findAll();
    }

    @Test
    void returnsEmptyJsonArrayWhenNoCardsExist() throws Exception {
        when(cardRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/cards"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("[]"));

        verify(cardRepository).findAll();
    }

    private Card card(Long id, String name) {
        Card card = new Card();
        card.setId(id);
        card.setName(name);
        card.setDescription("Description for " + name);
        card.setType(CardType.WEAPON);
        card.setCost(1);
        return card;
    }
}
