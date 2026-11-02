package com.andreicorrealemos.card_management.deck.model;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DeckTest {
    @Test
    void nameMustNotBeNullOrBlank() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            Deck deck = new Deck();
            assertTrue(validator.validate(deck).stream()
                    .anyMatch(error -> error.getPropertyPath().toString().equals("name")));

            deck.setName("   ");
            assertTrue(validator.validate(deck).stream()
                    .anyMatch(error -> error.getPropertyPath().toString().equals("name")));

            deck.setName("Arena deck");
            assertTrue(validator.validate(deck).isEmpty());
        }
    }
}
