package com.andreicorrealemos.card_management.card.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class CardTest {

    @Test
    void optionalNumericFieldsCanDistinguishNullFromZero() {
        Card card = new Card();

        assertNull(card.getAttack());

        card.setAttack(0);

        assertEquals(0, card.getAttack());
    }

    @Test
    void twoHandedDefaultsToFalse() {
        assertFalse(new Card().isTwoHanded());
    }

    @Test
    void parryBonusSetterUpdatesItsField() {
        Card card = new Card();

        card.setParryBonus(2);

        assertEquals(2, card.getParryBonus());
    }
}
