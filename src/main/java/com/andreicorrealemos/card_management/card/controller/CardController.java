package com.andreicorrealemos.card_management.card.controller;

import com.andreicorrealemos.card_management.card.dto.CardResponse;
import com.andreicorrealemos.card_management.card.dto.CreateCardRequest;
import com.andreicorrealemos.card_management.card.dto.UpdateCardRequest;
import com.andreicorrealemos.card_management.card.service.CardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;

import java.net.URI;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/cards")
public class CardController {
    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = Objects.requireNonNull(cardService, "cardService must not be null");
    }

    @PostMapping
    public ResponseEntity<CardResponse> create(@Valid @RequestBody CreateCardRequest request) {
        CardResponse response = cardService.create(request);
        return ResponseEntity.created(URI.create("/api/cards/" + response.id())).body(response);
    }

    @GetMapping
    public List<CardResponse> findAll() {
        return cardService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CardResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(cardService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CardResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCardRequest request
    ) {
        return ResponseEntity.ok(cardService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        cardService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
