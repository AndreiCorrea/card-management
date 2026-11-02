package com.andreicorrealemos.card_management.deck.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateDeckRequest {
    @NotBlank
    private String name;
    private String description;
    private List<@NotNull Long> cardIds;

    public CreateDeckRequest() {
    }

    public String name() { return name; }
    public String description() { return description; }
    public List<Long> cardIds() { return cardIds; }

    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setCardIds(List<Long> cardIds) { this.cardIds = cardIds; }
}
