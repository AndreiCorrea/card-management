package com.andreicorrealemos.card_management.card.repository;

import com.andreicorrealemos.card_management.card.model.Card;
import java.util.*;

public interface CardRepository {
    List<Card> findAll();
    Card findById(Long id);
    Card save(Card card);
    void deleteById(Long id);
}