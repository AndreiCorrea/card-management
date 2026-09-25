package com.andreicorrealemos.card_management.card.dto;

import com.andreicorrealemos.card_management.card.model.CardType;
import com.andreicorrealemos.card_management.card.model.ShieldType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class UpdateCardRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String description;
    @NotNull
    private CardType type;
    @NotNull
    @PositiveOrZero
    private Integer cost;
    @PositiveOrZero
    private Integer attack;
    @PositiveOrZero
    private Integer defense;
    @PositiveOrZero
    private Integer piercing;
    @PositiveOrZero
    private Integer durability;
    private boolean twoHanded;
    @PositiveOrZero
    private Integer magicDamage;
    @PositiveOrZero
    private Integer magicResistance;
    private ShieldType shieldType;
    @PositiveOrZero
    private Integer parryBonus;
    private String image;

    public UpdateCardRequest() {
    }

    public String name() { return name; }
    public String description() { return description; }
    public CardType type() { return type; }
    public Integer cost() { return cost; }
    public Integer attack() { return attack; }
    public Integer defense() { return defense; }
    public Integer piercing() { return piercing; }
    public Integer durability() { return durability; }
    public boolean twoHanded() { return twoHanded; }
    public Integer magicDamage() { return magicDamage; }
    public Integer magicResistance() { return magicResistance; }
    public ShieldType shieldType() { return shieldType; }
    public Integer parryBonus() { return parryBonus; }
    public String image() { return image; }

    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setType(CardType type) { this.type = type; }
    public void setCost(Integer cost) { this.cost = cost; }
    public void setAttack(Integer attack) { this.attack = attack; }
    public void setDefense(Integer defense) { this.defense = defense; }
    public void setPiercing(Integer piercing) { this.piercing = piercing; }
    public void setDurability(Integer durability) { this.durability = durability; }
    public void setTwoHanded(boolean twoHanded) { this.twoHanded = twoHanded; }
    public void setMagicDamage(Integer magicDamage) { this.magicDamage = magicDamage; }
    public void setMagicResistance(Integer magicResistance) { this.magicResistance = magicResistance; }
    public void setShieldType(ShieldType shieldType) { this.shieldType = shieldType; }
    public void setParryBonus(Integer parryBonus) { this.parryBonus = parryBonus; }
    public void setImage(String image) { this.image = image; }
}
