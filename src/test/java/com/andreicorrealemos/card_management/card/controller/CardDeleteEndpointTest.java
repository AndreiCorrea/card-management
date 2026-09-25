package com.andreicorrealemos.card_management.card.controller;

import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CardDeleteEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CardRepository cardRepository;

    @Test
    void deletesExistingCardAndReturns204WithoutBody() throws Exception {
        when(cardRepository.findById(42L)).thenReturn(new Card());

        mockMvc.perform(delete("/api/cards/42"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(cardRepository).findById(42L);
        verify(cardRepository).deleteById(42L);
    }

    @Test
    void returns404AndDoesNotDeleteWhenCardDoesNotExist() throws Exception {
        when(cardRepository.findById(42L)).thenReturn(null);

        mockMvc.perform(delete("/api/cards/42"))
                .andExpect(status().isNotFound());

        verify(cardRepository).findById(42L);
        verify(cardRepository, never()).deleteById(42L);
    }
}
