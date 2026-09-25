package com.andreicorrealemos.card_management.card.exception;

public class CardNotFoundException extends RuntimeException {
    public CardNotFoundException(Long id) {
        super("Card not found: " + id);
    }
}
