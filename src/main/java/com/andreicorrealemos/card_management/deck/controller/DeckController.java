package com.andreicorrealemos.card_management.deck.controller;

import com.andreicorrealemos.card_management.card.dto.CardResponse;
import com.andreicorrealemos.card_management.card.service.CardService;
import com.andreicorrealemos.card_management.deck.dto.CreateDeckRequest;
import com.andreicorrealemos.card_management.deck.dto.DeckCardEntryResponse;
import com.andreicorrealemos.card_management.deck.dto.DeckResponse;
import com.andreicorrealemos.card_management.deck.dto.DeckSummaryResponse;
import com.andreicorrealemos.card_management.deck.dto.UpdateDeckRequest;
import com.andreicorrealemos.card_management.deck.model.Deck;
import com.andreicorrealemos.card_management.deck.service.DeckService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/decks")
public class DeckController {
    private final DeckService deckService;
    private final CardService cardService;

    public DeckController(DeckService deckService, CardService cardService) {
        this.deckService = Objects.requireNonNull(deckService, "deckService must not be null");
        this.cardService = Objects.requireNonNull(cardService, "cardService must not be null");
    }

    @PostMapping
    public ResponseEntity<DeckResponse> create(@Valid @RequestBody CreateDeckRequest request) {
        Deck deck = deckService.create(request.name(), request.description(), request.cardIds());
        return ResponseEntity.created(URI.create("/api/decks/" + deck.getId()))
                .body(toResponse(deck));
    }

    @GetMapping
    public List<DeckSummaryResponse> findAll() {
        return deckService.findAll().stream()
                .map(deck -> new DeckSummaryResponse(
                        deck.getId(), deck.getName(), deck.getDescription(), deck.getCardIds().size()))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(toResponse(deckService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeckResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDeckRequest request
    ) {
        Deck deck = deckService.update(id, request.name(), request.description(), request.cardIds());
        return ResponseEntity.ok(toResponse(deck));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        deckService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private DeckResponse toResponse(Deck deck) {
        Map<Long, CardResponse> cardsById = cardService.findAll().stream()
                .collect(Collectors.toMap(CardResponse::id, Function.identity()));
        List<DeckCardEntryResponse> entries = deck.getCardIds().stream()
                .map(cardId -> {
                    CardResponse card = cardsById.get(cardId);
                    return new DeckCardEntryResponse(cardId, card != null, card);
                })
                .toList();
        return new DeckResponse(deck.getId(), deck.getName(), deck.getDescription(), entries);
    }
}
