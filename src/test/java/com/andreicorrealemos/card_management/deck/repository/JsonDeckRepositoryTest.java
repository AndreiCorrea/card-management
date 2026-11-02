package com.andreicorrealemos.card_management.deck.repository;

import com.andreicorrealemos.card_management.deck.model.Deck;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JsonDeckRepositoryTest {
    @TempDir
    Path temporaryDirectory;

    @Test
    void saveAndRetrievePreservesOrderedRepeatedCardIdsAndOptionalDescription() {
        Path deckFile = temporaryDirectory.resolve("nested").resolve("decks.json");
        JsonDeckRepository repository = new JsonDeckRepository(deckFile);
        Deck deck = deck("Armory", null, List.of(8L, 3L, 8L, 2L));

        Deck saved = repository.save(deck);
        Deck loaded = new JsonDeckRepository(deckFile).findById(saved.getId());

        assertEquals(1L, saved.getId());
        assertEquals("Armory", loaded.getName());
        assertNull(loaded.getDescription());
        assertEquals(List.of(8L, 3L, 8L, 2L), loaded.getCardIds());
        assertTrue(Files.isRegularFile(deckFile));
        assertTrue(Files.notExists(temporaryDirectory.resolve("cards.json")));
    }

    @Test
    void listReturnsMultipleDecksInPersistedOrder() {
        JsonDeckRepository repository = repositoryAt("decks.json");
        repository.save(deck("First", "Opening list", List.of(1L)));
        repository.save(deck("Second", null, List.of(2L, 3L)));

        assertEquals(List.of("First", "Second"), repository.findAll().stream().map(Deck::getName).toList());
    }

    @Test
    void deletePersistsAndDoesNotReuseDeckIdsAfterRepositoryReload() {
        Path file = temporaryDirectory.resolve("decks.json");
        JsonDeckRepository repository = new JsonDeckRepository(file);
        Deck first = repository.save(deck("First", null, List.of()));
        Deck second = repository.save(deck("Second", null, List.of(4L)));
        Deck third = repository.save(deck("Third", null, List.of(5L)));

        repository.deleteById(second.getId());
        JsonDeckRepository reloaded = new JsonDeckRepository(file);
        Deck fourth = reloaded.save(deck("Fourth", null, List.of()));

        assertEquals(1L, first.getId());
        assertEquals(3L, third.getId());
        assertEquals(4L, fourth.getId());
        assertNull(reloaded.findById(second.getId()));
        assertEquals(List.of("First", "Third", "Fourth"),
                reloaded.findAll().stream().map(Deck::getName).toList());
        assertEquals(5L, readDocument(file).path("nextId").longValue());
    }

    @Test
    void emptyDeckAndEmptyDescriptionCanBePersisted() {
        JsonDeckRepository repository = repositoryAt("decks.json");
        Deck saved = repository.save(deck("Empty deck", "", List.of()));
        Deck loaded = repository.findById(saved.getId());

        assertEquals("", loaded.getDescription());
        assertEquals(List.of(), loaded.getCardIds());
    }

    @Test
    void saveUpdatesExistingDeckWithoutChangingItsId() {
        JsonDeckRepository repository = repositoryAt("decks.json");
        Deck saved = repository.save(deck("Old name", null, List.of(1L, 1L)));
        Deck updated = deck("New name", "Updated description", List.of(3L, 2L, 3L));
        updated.setId(saved.getId());

        repository.save(updated);

        assertEquals(1, repository.findAll().size());
        assertEquals(saved.getId(), repository.findById(saved.getId()).getId());
        assertEquals("New name", repository.findById(saved.getId()).getName());
        assertEquals(List.of(3L, 2L, 3L), repository.findById(saved.getId()).getCardIds());
    }

    private JsonDeckRepository repositoryAt(String... pathParts) {
        Path file = temporaryDirectory;
        for (String pathPart : pathParts) {
            file = file.resolve(pathPart);
        }
        return new JsonDeckRepository(file);
    }

    private Deck deck(String name, String description, List<Long> cardIds) {
        Deck deck = new Deck();
        deck.setName(name);
        deck.setDescription(description);
        deck.setCardIds(cardIds);
        return deck;
    }

    private JsonNode readDocument(Path file) {
        try {
            return new ObjectMapper().readTree(file.toFile());
        } catch (IOException e) {
            throw new AssertionError("Could not read test JSON", e);
        }
    }
}
