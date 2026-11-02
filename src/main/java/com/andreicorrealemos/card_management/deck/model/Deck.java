package com.andreicorrealemos.card_management.deck.model;

import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

public class Deck {
    private Long id;

    @NotBlank
    private String name;

    private String description;
    private List<Long> cardIds = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<Long> getCardIds() { return cardIds; }
    public void setCardIds(List<Long> cardIds) {
        this.cardIds = cardIds == null ? new ArrayList<>() : new ArrayList<>(cardIds);
    }
}
