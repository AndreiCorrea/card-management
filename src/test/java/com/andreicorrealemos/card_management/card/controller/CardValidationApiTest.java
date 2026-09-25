package com.andreicorrealemos.card_management.card.controller;

import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.model.CardType;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CardValidationApiTest {
    private static final String VALID_BODY = """
            {
              "name": "Example",
              "description": "Example description",
              "type": "WEAPON",
              "cost": 2,
              "attack": null,
              "defense": null,
              "piercing": null,
              "durability": null,
              "twoHanded": true,
              "magicDamage": null,
              "magicResistance": null,
              "shieldType": null,
              "parryBonus": null,
              "image": null
            }
            """;

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @MockitoBean private CardRepository cardRepository;

    @ParameterizedTest(name = "POST rejects invalid {0}={1}")
    @MethodSource("invalidRequests")
    void postRejectsInvalidRequestsBeforeRepository(String field, String description, Object value, boolean absent) throws Exception {
        mockMvc.perform(post("/api/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(field, value, absent)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(cardRepository);
    }

    @ParameterizedTest(name = "PUT rejects invalid {0}={1}")
    @MethodSource("invalidRequests")
    void putRejectsInvalidRequestsBeforeRepository(String field, String description, Object value, boolean absent) throws Exception {
        mockMvc.perform(put("/api/cards/42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(field, value, absent)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(cardRepository);
    }

    @ParameterizedTest(name = "POST accepts optional {0}={1}")
    @MethodSource("optionalNullAndZeroValues")
    void postAcceptsNullAndZeroForOptionalNumbers(String field, Object value) throws Exception {
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(42L);
            return card;
        });

        mockMvc.perform(post("/api/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(field, value, false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$." + field).value(value));

        verify(cardRepository).save(any(Card.class));
    }

    @ParameterizedTest(name = "PUT accepts optional {0}={1}")
    @MethodSource("optionalNullAndZeroValues")
    void putAcceptsNullAndZeroForOptionalNumbers(String field, Object value) throws Exception {
        when(cardRepository.findById(42L)).thenReturn(existingCard());
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/cards/42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(field, value, false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$." + field).value(value));

        verify(cardRepository).save(any(Card.class));
    }

    @Test
    void postDefaultsOmittedTwoHandedToFalse() throws Exception {
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(42L);
            return card;
        });

        mockMvc.perform(post("/api/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody("twoHanded", null, true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.twoHanded").value(false));
    }

    @Test
    void putDefaultsOmittedTwoHandedToFalse() throws Exception {
        when(cardRepository.findById(42L)).thenReturn(existingCard());
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/cards/42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody("twoHanded", null, true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.twoHanded").value(false));
    }

    private String requestBody(String field, Object value, boolean absent) throws Exception {
        ObjectNode body = (ObjectNode) objectMapper.readTree(VALID_BODY);
        if (absent) {
            body.remove(field);
        } else {
            JsonNode jsonValue = objectMapper.valueToTree(value);
            body.set(field, jsonValue);
        }
        return objectMapper.writeValueAsString(body);
    }

    private static Card existingCard() {
        Card card = new Card();
        card.setId(42L);
        card.setName("Before update");
        card.setDescription("Existing card");
        card.setType(CardType.WEAPON);
        card.setCost(1);
        return card;
    }

    private static Stream<Arguments> invalidRequests() {
        Stream.Builder<Arguments> cases = Stream.builder();
        cases.add(Arguments.of("name", "absent", null, true));
        cases.add(Arguments.of("name", "null", null, false));
        cases.add(Arguments.of("name", "empty", "", false));
        cases.add(Arguments.of("name", "whitespace", "   ", false));
        cases.add(Arguments.of("description", "absent", null, true));
        cases.add(Arguments.of("description", "null", null, false));
        cases.add(Arguments.of("description", "empty", "", false));
        cases.add(Arguments.of("description", "whitespace", "   ", false));
        cases.add(Arguments.of("type", "null", null, false));
        cases.add(Arguments.of("type", "absent", null, true));
        cases.add(Arguments.of("cost", "absent", null, true));
        cases.add(Arguments.of("cost", "null", null, false));
        cases.add(Arguments.of("cost", "negative", -1, false));
        for (String field : new String[]{"attack", "defense", "piercing", "durability", "magicDamage", "magicResistance", "parryBonus"}) {
            cases.add(Arguments.of(field, "negative", -1, false));
        }
        return cases.build();
    }

    private static Stream<Arguments> optionalNullAndZeroValues() {
        return Stream.of("attack", "defense", "piercing", "durability", "magicDamage", "magicResistance", "parryBonus")
                .flatMap(field -> Stream.of(
                        Arguments.of(field, (Object) null),
                        Arguments.of(field, 0)));
    }
}
