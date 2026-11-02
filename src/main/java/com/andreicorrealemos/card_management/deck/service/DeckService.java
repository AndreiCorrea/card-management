package com.andreicorrealemos.card_management.deck.service;

import com.andreicorrealemos.card_management.card.exception.CardNotFoundException;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import com.andreicorrealemos.card_management.deck.exception.DeckNotFoundException;
import com.andreicorrealemos.card_management.deck.model.Deck;
import com.andreicorrealemos.card_management.deck.repository.DeckRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class DeckService {
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;

    public DeckService(DeckRepository deckRepository, CardRepository cardRepository) {
        this.deckRepository = Objects.requireNonNull(deckRepository, "deckRepository must not be null");
        this.cardRepository = Objects.requireNonNull(cardRepository, "cardRepository must not be null");
    }

    public Deck create(String name, String description, List<Long> cardIds) {
        validateName(name);
        List<Long> orderedCardIds = copyCardIds(cardIds);
        validateNewCardIds(orderedCardIds);

        Deck deck = new Deck();
        deck.setName(name);
        deck.setDescription(description);
        deck.setCardIds(orderedCardIds);
        return deckRepository.save(deck);
    }

    public List<Deck> findAll() {
        return deckRepository.findAll();
    }

    public Deck findById(Long id) {
        Deck deck = deckRepository.findById(id);
        if (deck == null) {
            throw new DeckNotFoundException(id);
        }
        return deck;
    }

    public Deck update(Long id, String name, String description, List<Long> cardIds) {
        Deck existingDeck = deckRepository.findById(id);
        if (existingDeck == null) {
            throw new DeckNotFoundException(id);
        }

        validateName(name);
        List<Long> orderedCardIds = copyCardIds(cardIds);
        validateUpdatedCardIds(existingDeck.getCardIds(), orderedCardIds);

        existingDeck.setName(name);
        existingDeck.setDescription(description);
        existingDeck.setCardIds(orderedCardIds);
        return deckRepository.save(existingDeck);
    }

    public void delete(Long id) {
        if (deckRepository.findById(id) == null) {
            throw new DeckNotFoundException(id);
        }
        deckRepository.deleteById(id);
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Deck name must not be blank");
        }
    }

    private void validateNewCardIds(List<Long> cardIds) {
        Set<Long> checkedIds = new HashSet<>();
        for (Long cardId : cardIds) {
            if (checkedIds.add(cardId) && cardRepository.findById(cardId) == null) {
                throw new CardNotFoundException(cardId);
            }
        }
    }

    private void validateUpdatedCardIds(List<Long> currentCardIds, List<Long> submittedCardIds) {
        Map<Long, Integer> existingOccurrences = countOccurrences(currentCardIds);
        Map<Long, Integer> submittedOccurrences = countOccurrences(submittedCardIds);

        for (Map.Entry<Long, Integer> entry : submittedOccurrences.entrySet()) {
            Long cardId = entry.getKey();
            if (cardId == null || (cardRepository.findById(cardId) == null
                    && entry.getValue() > existingOccurrences.getOrDefault(cardId, 0))) {
                throw new CardNotFoundException(cardId);
            }
        }
    }

    private Map<Long, Integer> countOccurrences(List<Long> cardIds) {
        Map<Long, Integer> occurrences = new HashMap<>();
        for (Long cardId : cardIds) {
            occurrences.merge(cardId, 1, Integer::sum);
        }
        return occurrences;
    }

    private List<Long> copyCardIds(List<Long> cardIds) {
        return cardIds == null ? new ArrayList<>() : new ArrayList<>(cardIds);
    }
}
