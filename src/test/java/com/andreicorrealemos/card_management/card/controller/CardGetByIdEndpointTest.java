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

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CardGetByIdEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CardRepository cardRepository;

    @Test
    void returnsCardResponseWhenCardExists() throws Exception {
        Card card = new Card();
        card.setId(37L);
        card.setName("Example Sword");
        card.setDescription("A simple sword.");
        card.setType(CardType.WEAPON);
        card.setCost(2);
        card.setAttack(0);
        card.setDefense(null);
        when(cardRepository.findById(37L)).thenReturn(card);

        mockMvc.perform(get("/api/cards/37"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(37))
                .andExpect(jsonPath("$.name").value("Example Sword"))
                .andExpect(jsonPath("$.description").value("A simple sword."))
                .andExpect(jsonPath("$.type").value("WEAPON"))
                .andExpect(jsonPath("$.attack").value(0))
                .andExpect(jsonPath("$.defense").value(nullValue()));

        verify(cardRepository).findById(37L);
    }

    @Test
    void returns404WhenCardDoesNotExist() throws Exception {
        when(cardRepository.findById(999L)).thenReturn(null);

        mockMvc.perform(get("/api/cards/999"))
                .andExpect(status().isNotFound());

        verify(cardRepository).findById(999L);
    }
}
