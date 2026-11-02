package com.andreicorrealemos.card_management.deck.repository;

import com.andreicorrealemos.card_management.deck.model.Deck;

import java.util.List;

public interface DeckRepository {
    List<Deck> findAll();
    Deck findById(Long id);
    Deck save(Deck deck);
    void deleteById(Long id);
}
