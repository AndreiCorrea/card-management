package com.andreicorrealemos.card_management.deck.service;

import com.andreicorrealemos.card_management.card.exception.CardNotFoundException;
import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import com.andreicorrealemos.card_management.deck.exception.DeckNotFoundException;
import com.andreicorrealemos.card_management.deck.model.Deck;
import com.andreicorrealemos.card_management.deck.repository.DeckRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DeckServiceTest {
    private final DeckRepository deckRepository = mock(DeckRepository.class);
    private final CardRepository cardRepository = mock(CardRepository.class);
    private final DeckService service = new DeckService(deckRepository, cardRepository);

    @Test
    void createValidatesCardsAndPreservesRepeatedIdsAndOrder() {
        when(cardRepository.findById(4L)).thenReturn(card(4L));
        when(cardRepository.findById(2L)).thenReturn(card(2L));
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> {
            Deck deck = invocation.getArgument(0);
            deck.setId(12L);
            return deck;
        });

        Deck created = service.create("Armory", "Main deck", List.of(4L, 2L, 4L));

        assertThat(created.getId()).isEqualTo(12L);
        assertThat(created.getName()).isEqualTo("Armory");
        assertThat(created.getDescription()).isEqualTo("Main deck");
        assertThat(created.getCardIds()).containsExactly(4L, 2L, 4L);
        verify(cardRepository).findById(4L);
        verify(cardRepository).findById(2L);
        verify(deckRepository).save(any(Deck.class));
        verifyNoMoreInteractions(cardRepository, deckRepository);
    }

    @Test
    void createRejectsUnknownCardIdWithoutSaving() {
        when(cardRepository.findById(99L)).thenReturn(null);

        assertThrows(CardNotFoundException.class, () -> service.create("Invalid", null, List.of(99L)));

        verify(cardRepository).findById(99L);
        verifyNoMoreInteractions(cardRepository, deckRepository);
    }

    @Test
    void createAllowsAnEmptyDeckAndOptionalDescription() {
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Deck created = service.create("Empty", null, List.of());

        assertThat(created.getDescription()).isNull();
        assertThat(created.getCardIds()).isEmpty();
        verify(deckRepository).save(any(Deck.class));
        verifyNoInteractions(cardRepository);
    }

    @Test
    void createRejectsNullOrBlankName() {
        assertThrows(IllegalArgumentException.class, () -> service.create(" ", null, List.of()));

        verifyNoInteractions(cardRepository, deckRepository);
    }

    @Test
    void updateChangesMetadataAndPreservesSubmittedCardOrderAndDuplicates() {
        Deck current = deck(7L, "Old", "Old description", List.of(1L, 2L));
        when(deckRepository.findById(7L)).thenReturn(current);
        when(cardRepository.findById(2L)).thenReturn(card(2L));
        when(cardRepository.findById(1L)).thenReturn(card(1L));
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Deck updated = service.update(7L, "New", "Updated", List.of(2L, 1L, 2L));

        assertThat(updated.getId()).isEqualTo(7L);
        assertThat(updated.getName()).isEqualTo("New");
        assertThat(updated.getDescription()).isEqualTo("Updated");
        assertThat(updated.getCardIds()).containsExactly(2L, 1L, 2L);
        verify(deckRepository).findById(7L);
        verify(cardRepository).findById(2L);
        verify(cardRepository).findById(1L);
        verify(deckRepository).save(current);
        verifyNoMoreInteractions(cardRepository, deckRepository);
    }

    @Test
    void updateRejectsUnknownNewCardIdWithoutChangingOrSavingDeck() {
        Deck current = deck(7L, "Current", null, List.of(1L));
        when(deckRepository.findById(7L)).thenReturn(current);
        when(cardRepository.findById(99L)).thenReturn(null);

        assertThrows(CardNotFoundException.class,
                () -> service.update(7L, "Changed", "Changed", List.of(1L, 99L)));

        assertThat(current.getName()).isEqualTo("Current");
        assertThat(current.getCardIds()).containsExactly(1L);
        verify(deckRepository).findById(7L);
        verify(cardRepository).findById(1L);
        verify(cardRepository).findById(99L);
        verifyNoMoreInteractions(cardRepository, deckRepository);
    }

    @Test
    void updatePreservesExistingDanglingReferencesWithoutIncreasingTheirCount() {
        Deck current = deck(7L, "Current", null, List.of(10L, 10L, 20L));
        when(deckRepository.findById(7L)).thenReturn(current);
        when(cardRepository.findById(10L)).thenReturn(card(10L));
        when(cardRepository.findById(20L)).thenReturn(null);
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Deck updated = service.update(7L, "Current", null, List.of(10L, 20L, 10L));

        assertThat(updated.getCardIds()).containsExactly(10L, 20L, 10L);
        verify(cardRepository).findById(10L);
        verify(cardRepository).findById(20L);
        verify(deckRepository).save(current);
    }

    @Test
    void updateAllowsRemovingExistingDanglingReferences() {
        Deck current = deck(7L, "Current", null, List.of(10L, 10L, 20L));
        when(deckRepository.findById(7L)).thenReturn(current);
        when(cardRepository.findById(10L)).thenReturn(card(10L));
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Deck updated = service.update(7L, "Current", null, List.of(10L, 10L));

        assertThat(updated.getCardIds()).containsExactly(10L, 10L);
        verify(cardRepository).findById(10L);
        verifyNoMoreInteractions(cardRepository);
        verify(deckRepository).findById(7L);
        verify(deckRepository).save(current);
        verifyNoMoreInteractions(deckRepository);
    }

    @Test
    void updateRejectsIncreasingOccurrencesOfAnExistingDanglingReference() {
        Deck current = deck(7L, "Current", null, List.of(10L, 10L, 20L));
        when(deckRepository.findById(7L)).thenReturn(current);
        when(cardRepository.findById(10L)).thenReturn(card(10L));
        when(cardRepository.findById(20L)).thenReturn(null);

        assertThrows(CardNotFoundException.class,
                () -> service.update(7L, "Changed", null, List.of(10L, 10L, 20L, 20L)));

        assertThat(current.getName()).isEqualTo("Current");
        assertThat(current.getCardIds()).containsExactly(10L, 10L, 20L);
        verify(deckRepository).findById(7L);
        verify(cardRepository).findById(20L);
        verifyNoMoreInteractions(cardRepository, deckRepository);
    }

    @Test
    void findMethodsDelegateToRepository() {
        Deck first = deck(1L, "First", null, List.of());
        Deck second = deck(2L, "Second", null, List.of());
        when(deckRepository.findAll()).thenReturn(List.of(first, second));
        when(deckRepository.findById(2L)).thenReturn(second);

        assertThat(service.findAll()).containsExactly(first, second);
        assertThat(service.findById(2L)).isSameAs(second);

        verify(deckRepository).findAll();
        verify(deckRepository).findById(2L);
        verifyNoMoreInteractions(deckRepository);
        verifyNoInteractions(cardRepository);
    }

    @Test
    void deleteDelegatesForExistingDeck() {
        when(deckRepository.findById(9L)).thenReturn(deck(9L, "Existing", null, List.of()));

        service.delete(9L);

        verify(deckRepository).findById(9L);
        verify(deckRepository).deleteById(9L);
        verifyNoMoreInteractions(deckRepository);
        verifyNoInteractions(cardRepository);
    }

    @Test
    void missingDeckOperationsThrowDeckNotFoundException() {
        when(deckRepository.findById(9L)).thenReturn(null);

        assertThrows(DeckNotFoundException.class, () -> service.findById(9L));
        assertThrows(DeckNotFoundException.class, () -> service.update(9L, "Name", null, List.of()));
        assertThrows(DeckNotFoundException.class, () -> service.delete(9L));

        verify(deckRepository, times(3)).findById(9L);
        verifyNoMoreInteractions(deckRepository);
        verifyNoInteractions(cardRepository);
    }

    private static Card card(Long id) {
        Card card = new Card();
        card.setId(id);
        return card;
    }

    private static Deck deck(Long id, String name, String description, List<Long> cardIds) {
        Deck deck = new Deck();
        deck.setId(id);
        deck.setName(name);
        deck.setDescription(description);
        deck.setCardIds(cardIds);
        return deck;
    }
}
