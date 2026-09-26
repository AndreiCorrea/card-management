package com.andreicorrealemos.card_management.card.service;

import com.andreicorrealemos.card_management.card.dto.CardResponse;
import com.andreicorrealemos.card_management.card.dto.CreateCardRequest;
import com.andreicorrealemos.card_management.card.dto.UpdateCardRequest;
import com.andreicorrealemos.card_management.card.exception.CardNotFoundException;
import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.model.CardType;
import com.andreicorrealemos.card_management.card.model.ShieldType;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CardServiceTest {
    private final CardRepository repository = mock(CardRepository.class);
    private final CardService service = new CardService(repository);

    @Test
    void createMapsEveryFieldAndReturnsRepositoryGeneratedId() {
        CreateCardRequest request = new CreateCardRequest();
        request.setName("Tower shield");
        request.setDescription("A reinforced shield");
        request.setType(CardType.SHIELD);
        request.setCost(0);
        request.setAttack(0);
        request.setDefense(2);
        request.setPiercing(3);
        request.setDurability(4);
        request.setTwoHanded(true);
        request.setMagicDamage(5);
        request.setMagicResistance(6);
        request.setShieldType(ShieldType.TOWER);
        request.setParryBonus(7);
        request.setImage("shield.png");
        // Return a separate persisted object so the response must use save's result.
        when(repository.save(any(Card.class))).thenReturn(fullCard(42L));

        assertThat(service.create(request)).isEqualTo(fullResponse(42L));

        ArgumentCaptor<Card> saved = ArgumentCaptor.forClass(Card.class);
        verify(repository).save(saved.capture());
        assertCard(saved.getValue(), fullResponse(null));
        verifyNoMoreInteractions(repository);
    }

    @Test
    void createPreservesUndefinedOptionalFieldsAndFalseTwoHanded() {
        CreateCardRequest request = new CreateCardRequest();
        request.setName("Spell");
        request.setDescription("An effect");
        request.setType(CardType.SPELL);
        request.setCost(0);
        request.setTwoHanded(false);
        when(repository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            assertCard(card, optionalResponse(null));
            card.setId(8L);
            return card;
        });

        assertThat(service.create(request)).isEqualTo(optionalResponse(8L));
        verify(repository).save(any(Card.class));
    }

    @Test
    void findAllMapsRepositoryCards() {
        when(repository.findAll()).thenReturn(List.of(fullCard(3L), fullCard(9L)));

        assertThat(service.findAll()).containsExactly(fullResponse(3L), fullResponse(9L));
        verify(repository).findAll();
    }

    @Test
    void findAllHandlesEmptyRepository() {
        when(repository.findAll()).thenReturn(List.of());

        assertThat(service.findAll()).isEmpty();
        verify(repository).findAll();
    }

    @Test
    void findByIdMapsTheRequestedCard() {
        when(repository.findById(9L)).thenReturn(fullCard(9L));

        assertThat(service.findById(9L)).isEqualTo(fullResponse(9L));
        verify(repository).findById(9L);
    }

    @Test
    void findByIdThrowsForMissingCard() {
        when(repository.findById(9L)).thenReturn(null);

        assertThrows(CardNotFoundException.class, () -> service.findById(9L));
        verify(repository).findById(9L);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void updateReplacesValuesIncludingNullAndZeroWhilePreservingId() {
        Card existing = fullCard(9L);
        when(repository.findById(9L)).thenReturn(existing);
        when(repository.save(any(Card.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UpdateCardRequest request = new UpdateCardRequest();
        request.setName("Spell");
        request.setDescription("An effect");
        request.setType(CardType.SPELL);
        request.setCost(0);
        request.setAttack(null);
        request.setDefense(0);
        request.setTwoHanded(false);
        CardResponse expected = new CardResponse(9L, "Spell", "An effect", CardType.SPELL,
                0, null, 0, null, null, false, null, null, null, null, null);

        assertThat(service.update(9L, request)).isEqualTo(expected);

        ArgumentCaptor<Card> saved = ArgumentCaptor.forClass(Card.class);
        verify(repository).findById(9L);
        verify(repository).save(saved.capture());
        assertCard(saved.getValue(), expected);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void updateThrowsWithoutSavingMissingCard() {
        when(repository.findById(9L)).thenReturn(null);

        assertThrows(CardNotFoundException.class, () -> service.update(9L, new UpdateCardRequest()));
        verify(repository).findById(9L);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void deleteDelegatesForExistingCard() {
        when(repository.findById(9L)).thenReturn(fullCard(9L));

        service.delete(9L);

        verify(repository).findById(9L);
        verify(repository).deleteById(9L);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void deleteThrowsWithoutDeletingMissingCard() {
        when(repository.findById(9L)).thenReturn(null);

        assertThrows(CardNotFoundException.class, () -> service.delete(9L));
        verify(repository).findById(9L);
        verifyNoMoreInteractions(repository);
    }

    private static Card fullCard(Long id) {
        Card card = new Card();
        card.setId(id);
        card.setName("Tower shield");
        card.setDescription("A reinforced shield");
        card.setType(CardType.SHIELD);
        card.setCost(0);
        card.setAttack(0);
        card.setDefense(2);
        card.setPiercing(3);
        card.setDurability(4);
        card.setTwoHanded(true);
        card.setMagicDamage(5);
        card.setMagicResistance(6);
        card.setShieldType(ShieldType.TOWER);
        card.setParryBonus(7);
        card.setImage("shield.png");
        return card;
    }

    private static CardResponse fullResponse(Long id) {
        return new CardResponse(id, "Tower shield", "A reinforced shield", CardType.SHIELD,
                0, 0, 2, 3, 4, true, 5, 6, ShieldType.TOWER, 7, "shield.png");
    }

    private static CardResponse optionalResponse(Long id) {
        return new CardResponse(id, "Spell", "An effect", CardType.SPELL,
                0, null, null, null, null, false, null, null, null, null, null);
    }

    private static void assertCard(Card card, CardResponse expected) {
        assertThat(card).extracting("id", "name", "description", "type", "cost", "attack",
                        "defense", "piercing", "durability", "twoHanded", "magicDamage",
                        "magicResistance", "shieldType", "parryBonus", "image")
                .containsExactly(expected.id(), expected.name(), expected.description(), expected.type(),
                        expected.cost(), expected.attack(), expected.defense(), expected.piercing(),
                        expected.durability(), expected.twoHanded(), expected.magicDamage(),
                        expected.magicResistance(), expected.shieldType(), expected.parryBonus(), expected.image());
    }
}
