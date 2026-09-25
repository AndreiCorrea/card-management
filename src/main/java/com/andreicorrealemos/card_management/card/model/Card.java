package com.andreicorrealemos.card_management.card.model;

public class Card {
    private Long id;
    private String name;
    private String description;
    private CardType type;
    private Integer cost;
    private Integer attack;
    private Integer defense;
    private Integer piercing;
    private Integer durability;
    private boolean twoHanded;
    private Integer magicDamage;
    private Integer magicResistance;
    private ShieldType shieldType;
    private Integer parryBonus;
    private String image;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public CardType getType() { return type; }
    public void setType(CardType type) { this.type = type; }

    public Integer getCost() { return cost; }
    public void setCost(Integer cost) { this.cost = cost; }

    public Integer getAttack() { return attack; }
    public void setAttack(Integer attack) { this.attack = attack; }

    public Integer getDefense() { return defense; }
    public void setDefense(Integer defense) { this.defense = defense; }

    public Integer getPiercing() { return piercing; }
    public void setPiercing(Integer piercing) { this.piercing = piercing; }

    public Integer getDurability() { return durability; }
    public void setDurability(Integer durability) { this.durability = durability; }

    public boolean isTwoHanded() { return twoHanded; }
    public void setTwoHanded(boolean twoHanded) { this.twoHanded = twoHanded; }

    public Integer getMagicDamage() { return magicDamage; }
    public void setMagicDamage(Integer magicDamage) { this.magicDamage = magicDamage; }

    public Integer getMagicResistance() { return magicResistance; }
    public void setMagicResistance(Integer magicResistance) { this.magicResistance = magicResistance; }

    public ShieldType getShieldType() { return shieldType; }
    public void setShieldType(ShieldType shieldType) { this.shieldType = shieldType; }

    public Integer getParryBonus() { return parryBonus; }
    public void setParryBonus(Integer parryBonus) { this.parryBonus = parryBonus; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}
