package com.andreicorrealemos.card_management.card.repository;

import com.andreicorrealemos.card_management.card.model.Card;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Repository
public class JsonCardRepository implements CardRepository {
    private static final Path DEFAULT_FILE_PATH = Path.of("data", "cards.json");
    private static final TypeReference<List<Card>> CARD_LIST_TYPE = new TypeReference<>() {};

    private final Path filePath;
    private final ObjectMapper objectMapper;

    public JsonCardRepository() {
        this(DEFAULT_FILE_PATH);
    }

    /** Constructor used to point the repository at an isolated data file. */
    public JsonCardRepository(Path filePath) {
        this(filePath, new ObjectMapper());
    }

    JsonCardRepository(Path filePath, ObjectMapper objectMapper) {
        this.filePath = Objects.requireNonNull(filePath, "filePath must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
    }

    @Override
    public List<Card> findAll() {
        return readData().cards;
    }

    @Override
    public Card findById(Long id) {
        List<Card> cards = findAll();
        return cards.stream()
                   .filter(card -> Objects.equals(card.getId(), id))
                   .findFirst()
                   .orElse(null);
    }

    @Override
    public Card save(Card card) {
        Objects.requireNonNull(card, "card must not be null");
        RepositoryData data = readData();

        if (card.getId() == null) {
            card.setId(data.nextId);
            try {
                data.nextId = Math.addExact(data.nextId, 1L);
            } catch (ArithmeticException e) {
                throw new IllegalStateException("Card ID sequence is exhausted", e);
            }
            data.cards.add(card);
        } else {
            int existingIndex = findIndexById(data.cards, card.getId());
            if (existingIndex < 0) {
                throw new IllegalArgumentException("Cannot update card that does not exist: " + card.getId());
            }
            data.cards.set(existingIndex, card);
        }

        writeData(data);
        return card;
    }

    @Override
    public void deleteById(Long id) {
        RepositoryData data = readData();
        data.cards.removeIf(card -> Objects.equals(card.getId(), id));
        writeData(data);
    }

    private int findIndexById(List<Card> cards, Long id) {
        for (int index = 0; index < cards.size(); index++) {
            if (Objects.equals(cards.get(index).getId(), id)) {
                return index;
            }
        }
        return -1;
    }

    private RepositoryData readData() {
        if (Files.notExists(filePath)) {
            return new RepositoryData(1L, new ArrayList<>());
        }

        final JsonNode root;
        try {
            root = objectMapper.readTree(filePath.toFile());
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read card data from " + filePath, e);
        }

        if (root == null || root.isNull()) {
            throw new IllegalStateException("Invalid card repository state in " + filePath + ": JSON root must not be null");
        }

        if (root.isArray()) {
            List<Card> cards = convertCards(root);
            return new RepositoryData(nextIdAfter(cards), cards);
        }

        if (!root.isObject()) {
            throw new IllegalStateException("Invalid card repository state in " + filePath + ": expected an object or legacy array");
        }

        JsonNode nextIdNode = root.get("nextId");
        JsonNode cardsNode = root.get("cards");
        if (nextIdNode == null || !nextIdNode.canConvertToLong() || !nextIdNode.isIntegralNumber()) {
            throw new IllegalStateException("Invalid card repository state in " + filePath + ": nextId must be an integer Long");
        }
        if (cardsNode == null || !cardsNode.isArray()) {
            throw new IllegalStateException("Invalid card repository state in " + filePath + ": cards must be an array");
        }

        long nextId = nextIdNode.longValue();
        if (nextId < 1) {
            throw new IllegalStateException("Invalid card repository state in " + filePath + ": nextId must be positive");
        }

        List<Card> cards = convertCards(cardsNode);
        for (Card card : cards) {
            if (card == null || card.getId() == null || card.getId() >= nextId) {
                throw new IllegalStateException("Invalid card repository state in " + filePath
                        + ": nextId must be greater than every stored card ID");
            }
        }
        return new RepositoryData(nextId, cards);
    }

    private List<Card> convertCards(JsonNode cardsNode) {
        try {
            List<Card> cards = objectMapper.convertValue(cardsNode, CARD_LIST_TYPE);
            if (cards == null) {
                throw new IllegalStateException("Invalid card repository state in " + filePath + ": cards must not be null");
            }
            return cards;
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid card repository state in " + filePath + ": cards could not be read", e);
        }
    }

    private long nextIdAfter(List<Card> cards) {
        long highestId = cards.stream()
                .filter(Objects::nonNull)
                .map(Card::getId)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(0L);
        try {
            return Math.addExact(highestId, 1L);
        } catch (ArithmeticException e) {
            throw new IllegalStateException("Invalid card repository state in " + filePath + ": no Long ID remains", e);
        }
    }

    private void writeData(RepositoryData data) {
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("nextId", data.nextId);
        document.put("cards", data.cards);

        try {
            Path parent = filePath.toAbsolutePath().getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            objectMapper.writeValue(filePath.toFile(), document);
        } catch (IOException | RuntimeException e) {
            throw new IllegalStateException("Failed to write card data to " + filePath, e);
        }
    }

    private static final class RepositoryData {
        private long nextId;
        private final List<Card> cards;

        private RepositoryData(long nextId, List<Card> cards) {
            this.nextId = nextId;
            this.cards = cards;
        }
    }
}
