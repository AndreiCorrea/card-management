package com.andreicorrealemos.card_management.deck.dto;

import com.andreicorrealemos.card_management.card.dto.CardResponse;

public record DeckCardEntryResponse(Long cardId, boolean available, CardResponse card) {
}
