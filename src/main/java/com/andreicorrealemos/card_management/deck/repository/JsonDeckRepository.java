package com.andreicorrealemos.card_management.deck.repository;

import com.andreicorrealemos.card_management.deck.model.Deck;
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
public class JsonDeckRepository implements DeckRepository {
    private static final Path DEFAULT_FILE_PATH = Path.of("data", "decks.json");
    private static final TypeReference<List<Deck>> DECK_LIST_TYPE = new TypeReference<>() {};

    private final Path filePath;
    private final ObjectMapper objectMapper;

    public JsonDeckRepository() {
        this(DEFAULT_FILE_PATH);
    }

    /** Constructor used to point the repository at an isolated data file. */
    public JsonDeckRepository(Path filePath) {
        this(filePath, new ObjectMapper());
    }

    JsonDeckRepository(Path filePath, ObjectMapper objectMapper) {
        this.filePath = Objects.requireNonNull(filePath, "filePath must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
    }

    @Override
    public List<Deck> findAll() {
        return readData().decks;
    }

    @Override
    public Deck findById(Long id) {
        return findAll().stream()
                .filter(deck -> Objects.equals(deck.getId(), id))
                .findFirst()
                .orElse(null);
    }

    @Override
    public Deck save(Deck deck) {
        Objects.requireNonNull(deck, "deck must not be null");
        RepositoryData data = readData();

        if (deck.getId() == null) {
            deck.setId(data.nextId);
            try {
                data.nextId = Math.addExact(data.nextId, 1L);
            } catch (ArithmeticException e) {
                throw new IllegalStateException("Deck ID sequence is exhausted", e);
            }
            data.decks.add(deck);
        } else {
            int existingIndex = findIndexById(data.decks, deck.getId());
            if (existingIndex < 0) {
                throw new IllegalArgumentException("Cannot update deck that does not exist: " + deck.getId());
            }
            data.decks.set(existingIndex, deck);
        }

        writeData(data);
        return deck;
    }

    @Override
    public void deleteById(Long id) {
        RepositoryData data = readData();
        data.decks.removeIf(deck -> Objects.equals(deck.getId(), id));
        writeData(data);
    }

    private int findIndexById(List<Deck> decks, Long id) {
        for (int index = 0; index < decks.size(); index++) {
            if (Objects.equals(decks.get(index).getId(), id)) {
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
            throw new IllegalStateException("Failed to read deck data from " + filePath, e);
        }

        if (root == null || root.isNull()) {
            throw new IllegalStateException("Invalid deck repository state in " + filePath + ": JSON root must not be null");
        }

        if (root.isArray()) {
            List<Deck> decks = convertDecks(root);
            return new RepositoryData(nextIdAfter(decks), decks);
        }

        if (!root.isObject()) {
            throw new IllegalStateException("Invalid deck repository state in " + filePath
                    + ": expected an object or legacy array");
        }

        JsonNode nextIdNode = root.get("nextId");
        JsonNode decksNode = root.get("decks");
        if (nextIdNode == null || !nextIdNode.canConvertToLong() || !nextIdNode.isIntegralNumber()) {
            throw new IllegalStateException("Invalid deck repository state in " + filePath
                    + ": nextId must be an integer Long");
        }
        if (decksNode == null || !decksNode.isArray()) {
            throw new IllegalStateException("Invalid deck repository state in " + filePath + ": decks must be an array");
        }

        long nextId = nextIdNode.longValue();
        if (nextId < 1) {
            throw new IllegalStateException("Invalid deck repository state in " + filePath + ": nextId must be positive");
        }

        List<Deck> decks = convertDecks(decksNode);
        for (Deck deck : decks) {
            if (deck == null || deck.getId() == null || deck.getId() >= nextId) {
                throw new IllegalStateException("Invalid deck repository state in " + filePath
                        + ": nextId must be greater than every stored deck ID");
            }
        }
        return new RepositoryData(nextId, decks);
    }

    private List<Deck> convertDecks(JsonNode decksNode) {
        try {
            List<Deck> decks = objectMapper.convertValue(decksNode, DECK_LIST_TYPE);
            if (decks == null) {
                throw new IllegalStateException("Invalid deck repository state in " + filePath + ": decks must not be null");
            }
            return decks;
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid deck repository state in " + filePath
                    + ": decks could not be read", e);
        }
    }

    private long nextIdAfter(List<Deck> decks) {
        long highestId = decks.stream()
                .filter(Objects::nonNull)
                .map(Deck::getId)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(0L);
        try {
            return Math.addExact(highestId, 1L);
        } catch (ArithmeticException e) {
            throw new IllegalStateException("Invalid deck repository state in " + filePath + ": no Long ID remains", e);
        }
    }

    private void writeData(RepositoryData data) {
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("nextId", data.nextId);
        document.put("decks", data.decks);

        try {
            Path parent = filePath.toAbsolutePath().getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            objectMapper.writeValue(filePath.toFile(), document);
        } catch (IOException | RuntimeException e) {
            throw new IllegalStateException("Failed to write deck data to " + filePath, e);
        }
    }

    private static final class RepositoryData {
        private long nextId;
        private final List<Deck> decks;

        private RepositoryData(long nextId, List<Deck> decks) {
            this.nextId = nextId;
            this.decks = decks;
        }
    }
}
