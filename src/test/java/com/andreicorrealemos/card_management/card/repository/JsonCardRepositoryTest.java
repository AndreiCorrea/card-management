package com.andreicorrealemos.card_management.card.repository;

import com.andreicorrealemos.card_management.card.model.Card;
import com.andreicorrealemos.card_management.card.model.CardType;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JsonCardRepositoryTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void missingFileReturnsEmptyListAndSaveCreatesParentDirectory() {
        JsonCardRepository repository = repositoryAt("nested", "data", "cards.json");

        assertEquals(List.of(), repository.findAll());
        Card saved = repository.save(card("Sword"));

        assertEquals(1L, saved.getId());
        assertEquals("Sword", repository.findById(1L).getName());
        assertEquals(1, repository.findAll().size());
        JsonNode document = readDocument(temporaryDirectory.resolve("nested").resolve("data").resolve("cards.json"));
        assertEquals(2L, document.get("nextId").longValue());
        assertEquals(1, document.get("cards").size());
    }

    @Test
    void saveUpdatesExistingCardWithoutChangingItsId() {
        JsonCardRepository repository = repositoryAt("cards.json");
        Card saved = repository.save(card("Old name"));

        Card updated = card("New name");
        updated.setId(saved.getId());
        repository.save(updated);

        assertEquals(1, repository.findAll().size());
        assertEquals("New name", repository.findById(saved.getId()).getName());
    }

    @Test
    void persistencePreservesNullAndZeroForOptionalNumericFields() {
        Path file = temporaryDirectory.resolve("cards.json");
        JsonCardRepository repository = new JsonCardRepository(file);
        Card card = card("Optional values");
        card.setAttack(0);
        card.setDefense(null);
        repository.save(card);

        Card loaded = new JsonCardRepository(file).findById(card.getId());

        assertEquals(0, loaded.getAttack());
        assertNull(loaded.getDefense());
    }

    @Test
    void nextIdUsesHighestExistingIdAndDoesNotReuseDeletedIds() {
        JsonCardRepository repository = repositoryAt("cards.json");
        Card first = repository.save(card("First"));
        Card second = repository.save(card("Second"));
        Card third = repository.save(card("Third"));

        repository.deleteById(second.getId());

        Card fourth = repository.save(card("Fourth"));

        assertEquals(1L, first.getId());
        assertEquals(3L, third.getId());
        assertEquals(4L, fourth.getId());
        assertNull(repository.findById(second.getId()));
    }

    @Test
    void deletingHighestIdAndRestartingDoesNotReuseIt() {
        Path file = temporaryDirectory.resolve("cards.json");
        JsonCardRepository repository = new JsonCardRepository(file);
        repository.save(card("First"));
        Card highest = repository.save(card("Highest"));
        repository.deleteById(highest.getId());

        Card afterRestart = new JsonCardRepository(file).save(card("After restart"));

        assertEquals(3L, afterRestart.getId());
        assertEquals(4L, readDocument(file).get("nextId").longValue());
    }

    @Test
    void legacyArrayIsReadAndMigratedOnNextPersistenceOperation() {
        Path file = temporaryDirectory.resolve("cards.json");
        write(file, "[{\"id\":7,\"name\":\"Legacy\",\"description\":\"Old card\","
                + "\"type\":\"WEAPON\",\"cost\":1,\"twoHanded\":false}]");
        JsonCardRepository repository = new JsonCardRepository(file);

        assertEquals("Legacy", repository.findById(7L).getName());
        repository.deleteById(7L);

        JsonNode migrated = readDocument(file);
        assertTrue(migrated.isObject());
        assertEquals(8L, migrated.get("nextId").longValue());
        assertEquals(0, migrated.get("cards").size());
        assertEquals(8L, new JsonCardRepository(file).save(card("After migration")).getId());
    }

    @Test
    void saveRejectsAnUnknownExplicitId() {
        JsonCardRepository repository = repositoryAt("cards.json");
        Card card = card("Unknown");
        card.setId(10L);

        assertThrows(IllegalArgumentException.class, () -> repository.save(card));
        assertEquals(List.of(), repository.findAll());
    }

    @Test
    void malformedJsonRaisesAnExceptionInsteadOfReturningAnEmptyList() throws IOException {
        Path file = temporaryDirectory.resolve("cards.json");
        Files.writeString(file, "not-json");
        JsonCardRepository repository = new JsonCardRepository(file);

        assertThrows(IllegalStateException.class, repository::findAll);
    }

    @Test
    void jsonNullRootRaisesClearInvalidStateException() throws IOException {
        Path file = temporaryDirectory.resolve("cards.json");
        Files.writeString(file, "null");
        JsonCardRepository repository = new JsonCardRepository(file);

        IllegalStateException exception = assertThrows(IllegalStateException.class, repository::findAll);

        assertTrue(exception.getMessage().contains("JSON root must not be null"));
    }

    @Test
    void invalidNextIdStatesAreRejected() {
        List<String> invalidDocuments = List.of(
                "{\"nextId\":0,\"cards\":[]}",
                "{\"nextId\":1,\"cards\":[{\"id\":1}]}",
                "{\"nextId\":2,\"cards\":[{\"id\":2}]}",
                "{\"nextId\":1.5,\"cards\":[]}"
        );

        for (int index = 0; index < invalidDocuments.size(); index++) {
            Path file = temporaryDirectory.resolve("invalid-" + index + ".json");
            write(file, invalidDocuments.get(index));

            assertThrows(IllegalStateException.class, () -> new JsonCardRepository(file).findAll());
        }
    }

    @Test
    void writeFailureRaisesAnException() throws IOException {
        Path directoryAtFilePath = temporaryDirectory.resolve("cards.json");
        Files.createDirectory(directoryAtFilePath);
        JsonCardRepository repository = new JsonCardRepository(directoryAtFilePath);

        assertThrows(IllegalStateException.class, () -> repository.save(card("Cannot write")));
    }

    @Test
    void deletePersistsChangesToDisk() {
        Path file = temporaryDirectory.resolve("cards.json");
        JsonCardRepository repository = new JsonCardRepository(file);
        Card saved = repository.save(card("Temporary"));

        repository.deleteById(saved.getId());

        assertEquals(List.of(), new JsonCardRepository(file).findAll());
        assertTrue(Files.exists(file));
    }

    private JsonCardRepository repositoryAt(String... pathParts) {
        Path file = temporaryDirectory;
        for (String pathPart : pathParts) {
            file = file.resolve(pathPart);
        }
        return new JsonCardRepository(file);
    }

    private Card card(String name) {
        Card card = new Card();
        card.setName(name);
        card.setDescription("Description for " + name);
        card.setType(CardType.WEAPON);
        card.setCost(1);
        return card;
    }

    private JsonNode readDocument(Path file) {
        try {
            return new ObjectMapper().readTree(file.toFile());
        } catch (IOException e) {
            throw new AssertionError("Could not read test JSON", e);
        }
    }

    private void write(Path file, String json) {
        try {
            Files.writeString(file, json);
        } catch (IOException e) {
            throw new AssertionError("Could not write test JSON", e);
        }
    }
}
