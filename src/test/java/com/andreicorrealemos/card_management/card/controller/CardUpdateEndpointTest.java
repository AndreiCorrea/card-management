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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CardUpdateEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CardRepository cardRepository;

    @Test
    void updatesExistingCardPreservingItsIdAndOptionalNumericValues() throws Exception {
        Card existingCard = card(55L, "Old name");
        when(cardRepository.findById(55L)).thenReturn(existingCard);
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/cards/55")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Updated shield",
                                  "description": "Updated description.",
                                  "type": "SHIELD",
                                  "cost": 0,
                                  "attack": 0,
                                  "defense": null,
                                  "twoHanded": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(55))
                .andExpect(jsonPath("$.name").value("Updated shield"))
                .andExpect(jsonPath("$.description").value("Updated description."))
                .andExpect(jsonPath("$.type").value("SHIELD"))
                .andExpect(jsonPath("$.cost").value(0))
                .andExpect(jsonPath("$.attack").value(0))
                .andExpect(jsonPath("$.defense").value(nullValue()))
                .andExpect(jsonPath("$.twoHanded").value(true));

        verify(cardRepository).findById(55L);
        var savedCardCaptor = org.mockito.ArgumentCaptor.forClass(Card.class);
        verify(cardRepository).save(savedCardCaptor.capture());
        assertEquals(55L, savedCardCaptor.getValue().getId());
    }

    @Test
    void returns404AndDoesNotSaveWhenIdDoesNotExist() throws Exception {
        when(cardRepository.findById(999L)).thenReturn(null);

        mockMvc.perform(put("/api/cards/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "New card",
                                  "description": "This must not be created.",
                                  "type": "WEAPON",
                                  "cost": 1,
                                  "twoHanded": false
                                }
                                """))
                .andExpect(status().isNotFound());

        verify(cardRepository).findById(999L);
        verify(cardRepository, never()).save(any(Card.class));
    }

    private Card card(Long id, String name) {
        Card card = new Card();
        card.setId(id);
        card.setName(name);
        card.setDescription("Old description.");
        card.setType(CardType.WEAPON);
        card.setCost(2);
        card.setAttack(3);
        card.setDefense(4);
        card.setTwoHanded(false);
        return card;
    }
}
