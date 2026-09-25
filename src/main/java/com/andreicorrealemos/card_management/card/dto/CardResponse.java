package com.andreicorrealemos.card_management.card.dto;

import com.andreicorrealemos.card_management.card.model.CardType;
import com.andreicorrealemos.card_management.card.model.ShieldType;

public record CardResponse(
        Long id,
        String name,
        String description,
        CardType type,
        Integer cost,
        Integer attack,
        Integer defense,
        Integer piercing,
        Integer durability,
        boolean twoHanded,
        Integer magicDamage,
        Integer magicResistance,
        ShieldType shieldType,
        Integer parryBonus,
        String image
) {
}
