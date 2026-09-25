package com.andreicorrealemos.card_management.card.service;

import com.andreicorrealemos.card_management.card.dto.CardResponse;
import com.andreicorrealemos.card_management.card.dto.CreateCardRequest;
import com.andreicorrealemos.card_management.card.dto.UpdateCardRequest;
import com.andreicorrealemos.card_management.card.exception.CardNotFoundException;
import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.repository.CardRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class CardService {
    private final CardRepository cardRepository;

    public CardService(CardRepository cardRepository) {
        this.cardRepository = Objects.requireNonNull(cardRepository, "cardRepository must not be null");
    }

    public CardResponse create(CreateCardRequest request) {
        Card card = new Card();
        card.setName(request.name());
        card.setDescription(request.description());
        card.setType(request.type());
        card.setCost(request.cost());
        card.setAttack(request.attack());
        card.setDefense(request.defense());
        card.setPiercing(request.piercing());
        card.setDurability(request.durability());
        card.setTwoHanded(request.twoHanded());
        card.setMagicDamage(request.magicDamage());
        card.setMagicResistance(request.magicResistance());
        card.setShieldType(request.shieldType());
        card.setParryBonus(request.parryBonus());
        card.setImage(request.image());

        Card savedCard = cardRepository.save(card);
        return toResponse(savedCard);
    }

    public List<CardResponse> findAll() {
        return cardRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CardResponse findById(Long id) {
        Card card = cardRepository.findById(id);
        if (card == null) {
            throw new CardNotFoundException(id);
        }
        return toResponse(card);
    }

    public CardResponse update(Long id, UpdateCardRequest request) {
        Card existingCard = cardRepository.findById(id);
        if (existingCard == null) {
            throw new CardNotFoundException(id);
        }

        existingCard.setName(request.name());
        existingCard.setDescription(request.description());
        existingCard.setType(request.type());
        existingCard.setCost(request.cost());
        existingCard.setAttack(request.attack());
        existingCard.setDefense(request.defense());
        existingCard.setPiercing(request.piercing());
        existingCard.setDurability(request.durability());
        existingCard.setTwoHanded(request.twoHanded());
        existingCard.setMagicDamage(request.magicDamage());
        existingCard.setMagicResistance(request.magicResistance());
        existingCard.setShieldType(request.shieldType());
        existingCard.setParryBonus(request.parryBonus());
        existingCard.setImage(request.image());

        return toResponse(cardRepository.save(existingCard));
    }

    public void delete(Long id) {
        if (cardRepository.findById(id) == null) {
            throw new CardNotFoundException(id);
        }

        cardRepository.deleteById(id);
    }

    private CardResponse toResponse(Card card) {
        return new CardResponse(
                card.getId(),
                card.getName(),
                card.getDescription(),
                card.getType(),
                card.getCost(),
                card.getAttack(),
                card.getDefense(),
                card.getPiercing(),
                card.getDurability(),
                card.isTwoHanded(),
                card.getMagicDamage(),
                card.getMagicResistance(),
                card.getShieldType(),
                card.getParryBonus(),
                card.getImage()
        );
    }
}
