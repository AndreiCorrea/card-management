package com.andreicorrealemos.card_management.deck.exception;

public class DeckNotFoundException extends RuntimeException {
    public DeckNotFoundException(Long id) {
        super("Deck not found: " + id);
    }
}
