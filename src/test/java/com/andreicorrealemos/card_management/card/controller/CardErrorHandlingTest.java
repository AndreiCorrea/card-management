package com.andreicorrealemos.card_management.card.controller;

import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CardErrorHandlingTest {
    private static final String VALID_BODY = """
            {
              "name": "Example",
              "description": "Example description",
              "type": "WEAPON",
              "cost": 2,
              "twoHanded": false
            }
            """;

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @MockitoBean private CardRepository cardRepository;

    @Test
    void getMissingCardReturnsStandard404Body() throws Exception {
        when(cardRepository.findById(404L)).thenReturn(null);

        mockMvc.perform(get("/api/cards/404"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Card not found"))
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void putMissingCardReturnsStandard404Body() throws Exception {
        when(cardRepository.findById(404L)).thenReturn(null);

        mockMvc.perform(put("/api/cards/404")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Card not found"))
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void deleteMissingCardReturnsStandard404Body() throws Exception {
        when(cardRepository.findById(404L)).thenReturn(null);

        mockMvc.perform(delete("/api/cards/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Card not found"))
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void postValidationReturnsStandard400BodyWithFieldMessages() throws Exception {
        mockMvc.perform(post("/api/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"  ","description":"Example","type":"WEAPON","cost":-1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").value("must not be blank"))
                .andExpect(jsonPath("$.errors.cost").value("must be greater than or equal to 0"));

        verifyNoInteractions(cardRepository);
    }

    @Test
    void putValidationReturnsStandard400BodyAndDoesNotReachRepository() throws Exception {
        mockMvc.perform(put("/api/cards/42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Example","description":"Example","type":"WEAPON","cost":null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.cost").value("must not be null"));

        verifyNoInteractions(cardRepository);
    }

    @Test
    void malformedJsonReturnsStandard400BodyWithoutParserDetails() throws Exception {
        assertUnreadableRequest("{\"name\":");
    }

    @Test
    void unknownCardTypeReturnsStandard400BodyWithoutEnumDetails() throws Exception {
        assertUnreadableRequest(requestBody("type", "NOT_A_CARD_TYPE"));
    }

    @Test
    void unknownShieldTypeReturnsStandard400BodyWithoutEnumDetails() throws Exception {
        assertUnreadableRequest(requestBody("shieldType", "NOT_A_SHIELD_TYPE"));
    }

    @Test
    void unexpectedRepositoryExceptionReturnsSafeGeneric500Body() throws Exception {
        when(cardRepository.findAll()).thenThrow(new IllegalStateException("SECRET C:\\private\\cards.json"));

        mockMvc.perform(get("/api/cards"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Internal server error"))
                .andExpect(jsonPath("$.errors").isEmpty())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("SECRET"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("cards.json"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("stackTrace"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("at com."))));

        verify(cardRepository).findAll();
    }

    @Test
    void errorResponsesUseTheSameObjectFields() throws Exception {
        when(cardRepository.findById(404L)).thenReturn(null);

        mockMvc.perform(get("/api/cards/404"))
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.errors").exists());
    }

    private void assertUnreadableRequest(String body) throws Exception {
        mockMvc.perform(post("/api/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid request body"))
                .andExpect(jsonPath("$.errors.body").value("Malformed JSON or invalid field value"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("NOT_A_"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("stackTrace"))));

        verifyNoInteractions(cardRepository);
    }

    private String requestBody(String field, String value) throws Exception {
        ObjectNode body = (ObjectNode) objectMapper.readTree(VALID_BODY);
        body.put(field, value);
        return objectMapper.writeValueAsString(body);
    }
}
