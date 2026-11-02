package com.andreicorrealemos.card_management.deck.dto;

import java.util.List;

public record DeckResponse(Long id, String name, String description, List<DeckCardEntryResponse> cards) {
}
