package com.andreicorrealemos.card_management.deck.controller;

import com.andreicorrealemos.card_management.card.repository.CardRepository;
import com.andreicorrealemos.card_management.card.repository.JsonCardRepository;
import com.andreicorrealemos.card_management.deck.repository.DeckRepository;
import com.andreicorrealemos.card_management.deck.repository.JsonDeckRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.convention.TestBean;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class DeckCrudIntegrationTest {
    @TempDir
    static Path temporaryDirectory;

    @TestBean(methodName = "isolatedCardRepository", enforceOverride = true)
    private CardRepository cardRepository;

    @TestBean(methodName = "isolatedDeckRepository", enforceOverride = true)
    private DeckRepository deckRepository;

    @Value("${local.server.port}")
    private int port;

    private final ObjectMapper mapper = new ObjectMapper();

    static CardRepository isolatedCardRepository() {
        return new JsonCardRepository(cardDataFile());
    }

    static DeckRepository isolatedDeckRepository() {
        return new JsonDeckRepository(deckDataFile());
    }

    private static Path cardDataFile() {
        return temporaryDirectory.resolve("data").resolve("cards.json");
    }

    private static Path deckDataFile() {
        return temporaryDirectory.resolve("data").resolve("decks.json");
    }

    @BeforeEach
    void clearIsolatedFiles() throws Exception {
        Files.deleteIfExists(cardDataFile());
        Files.deleteIfExists(deckDataFile());
    }

    @Test
    void completeDeckCrudFlowReturnsOrderedResolvedEntriesAndSummary() throws Exception {
        try (HttpClient client = client()) {
            long firstCardId = createCard(client, "Moon Blade");
            long secondCardId = createCard(client, "Tower Shield");
            String payload = """
                    {"name":"Night Guard","description":"Keeps the pass.","cardIds":[%d,%d,%d]}
                    """.formatted(secondCardId, firstCardId, secondCardId);

            HttpResponse<String> createdResponse = send(client, "POST", "/api/decks", payload);
            JsonNode created = json(createdResponse, 201);
            long deckId = created.path("id").longValue();
            String deckUrl = "/api/decks/" + deckId;
            assertEquals(deckUrl, createdResponse.headers().firstValue("Location").orElseThrow());
            assertEquals("Night Guard", created.path("name").textValue());
            assertEquals("Keeps the pass.", created.path("description").textValue());
            assertEntries(created.path("cards"), secondCardId, firstCardId, secondCardId);
            assertTrue(Files.isRegularFile(cardDataFile()));
            assertTrue(Files.isRegularFile(deckDataFile()));

            JsonNode list = json(send(client, "GET", "/api/decks", null), 200);
            assertEquals(1, list.size());
            assertEquals(deckId, list.get(0).path("id").longValue());
            assertEquals(3, list.get(0).path("cardCount").intValue());
            assertFalse(list.get(0).has("cards"), "Collection response should remain a concise summary");

            assertEntries(json(send(client, "GET", deckUrl, null), 200).path("cards"),
                    secondCardId, firstCardId, secondCardId);

            String update = """
                    {"name":"Night Watch","description":"Updated patrol.","cardIds":[%d,%d,%d]}
                    """.formatted(firstCardId, secondCardId, firstCardId);
            JsonNode updated = json(send(client, "PUT", deckUrl, update), 200);
            assertEquals("Night Watch", updated.path("name").textValue());
            assertEquals("Updated patrol.", updated.path("description").textValue());
            assertEntries(updated.path("cards"), firstCardId, secondCardId, firstCardId);

            HttpResponse<String> deleted = send(client, "DELETE", deckUrl, null);
            assertEquals(204, deleted.statusCode());
            assertEquals("", deleted.body());
            assertError(send(client, "GET", deckUrl, null), 404, "Deck not found");

            // Card CRUD continues to use the existing endpoints and response contract.
            assertEquals("Moon Blade", json(send(client, "GET", "/api/cards/" + firstCardId, null), 200)
                    .path("name").textValue());
        }
    }

    @Test
    void supportsEmptyDeckAndOmittedOptionalDescription() throws Exception {
        try (HttpClient client = client()) {
            JsonNode created = json(send(client, "POST", "/api/decks", """
                    {"name":"Empty Archive"}
                    """), 201);
            assertTrue(created.path("description").isNull());
            assertEquals(0, created.path("cards").size());

            String url = "/api/decks/" + created.path("id").longValue();
            JsonNode updated = json(send(client, "PUT", url, """
                    {"name":"Still Empty","description":"No entries yet.","cardIds":[]}
                    """), 200);
            assertEquals("Still Empty", updated.path("name").textValue());
            assertEquals(0, updated.path("cards").size());
            assertEquals(0, json(send(client, "GET", "/api/decks", null), 200)
                    .get(0).path("cardCount").intValue());
        }
    }

    @Test
    void rejectsBlankNamesUnknownCardReferencesAndMalformedBodies() throws Exception {
        try (HttpClient client = client()) {
            JsonNode blankName = json(send(client, "POST", "/api/decks", """
                    {"name":"   "}
                    """), 400);
            assertEquals("Validation failed", blankName.path("message").textValue());
            assertTrue(blankName.path("errors").has("name"));

            assertError(send(client, "POST", "/api/decks", """
                    {"name":"Invalid reference","cardIds":[987654]}
                    """), 404, "Card not found");

            JsonNode empty = json(send(client, "POST", "/api/decks", """
                    {"name":"Valid deck"}
                    """), 201);
            String url = "/api/decks/" + empty.path("id").longValue();
            assertError(send(client, "PUT", url, """
                    {"name":"Updated","description":null,"cardIds":[987654]}
                    """), 404, "Card not found");

            JsonNode missingCardIds = json(send(client, "PUT", url, """
                    {"name":"Updated"}
                    """), 400);
            assertEquals("Validation failed", missingCardIds.path("message").textValue());

            JsonNode malformed = json(send(client, "POST", "/api/decks", "{\"name\":"), 400);
            assertEquals("Invalid request body", malformed.path("message").textValue());
            assertError(send(client, "GET", "/api/decks/999", null), 404, "Deck not found");
        }
    }

    @Test
    void representsDanglingCardsAndAllowsRetainingOrRemovingButNotAddingCopies() throws Exception {
        try (HttpClient client = client()) {
            long firstCardId = createCard(client, "Still Available");
            long deletedCardId = createCard(client, "Gone from Archive");
            JsonNode created = json(send(client, "POST", "/api/decks", """
                    {"name":"Mixed Deck","cardIds":[%d,%d,%d]}
                    """.formatted(firstCardId, deletedCardId, firstCardId)), 201);
            String deckUrl = "/api/decks/" + created.path("id").longValue();

            assertEquals(204, send(client, "DELETE", "/api/cards/" + deletedCardId, null).statusCode());
            JsonNode detailWithDanglingReference = json(send(client, "GET", deckUrl, null), 200);
            JsonNode entries = detailWithDanglingReference.path("cards");
            assertEquals(3, entries.size());
            assertTrue(entries.get(1).path("cardId").isNumber());
            assertEquals(deletedCardId, entries.get(1).path("cardId").longValue());
            assertFalse(entries.get(1).path("available").booleanValue());
            assertTrue(entries.get(1).path("card").isNull());

            JsonNode retained = json(send(client, "PUT", deckUrl, """
                    {"name":"Mixed Deck","cardIds":[%d,%d,%d]}
                    """.formatted(firstCardId, deletedCardId, firstCardId)), 200);
            JsonNode retainedEntries = retained.path("cards");
            assertEquals(3, retainedEntries.size());
            assertEquals(firstCardId, retainedEntries.get(0).path("cardId").longValue());
            assertTrue(retainedEntries.get(0).path("available").booleanValue());
            assertEquals(deletedCardId, retainedEntries.get(1).path("cardId").longValue());
            assertFalse(retained.path("cards").get(1).path("available").booleanValue());
            assertTrue(retainedEntries.get(1).path("card").isNull());
            assertEquals(firstCardId, retainedEntries.get(2).path("cardId").longValue());
            assertTrue(retainedEntries.get(2).path("available").booleanValue());
            assertEquals(firstCardId, retainedEntries.get(2).path("card").path("id").longValue());

            assertError(send(client, "PUT", deckUrl, """
                    {"name":"Mixed Deck","cardIds":[%d,%d,%d,%d]}
                    """.formatted(firstCardId, deletedCardId, firstCardId, deletedCardId)),
                    404, "Card not found");

            JsonNode removed = json(send(client, "PUT", deckUrl, """
                    {"name":"Mixed Deck","cardIds":[%d,%d]}
                    """.formatted(firstCardId, firstCardId)), 200);
            assertEntries(removed.path("cards"), firstCardId, firstCardId);
        }
    }

    private long createCard(HttpClient client, String name) throws Exception {
        JsonNode card = json(send(client, "POST", "/api/cards", """
                {"name":"%s","description":"Test card","type":"WEAPON","cost":0}
                """.formatted(name)), 201);
        return card.path("id").longValue();
    }

    private void assertEntries(JsonNode entries, long... cardIds) {
        assertEquals(cardIds.length, entries.size());
        for (int index = 0; index < cardIds.length; index++) {
            JsonNode entry = entries.get(index);
            assertEquals(cardIds[index], entry.path("cardId").longValue());
            assertTrue(entry.path("available").booleanValue());
            assertEquals(cardIds[index], entry.path("card").path("id").longValue());
        }
    }

    private HttpClient client() {
        return HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    private HttpResponse<String> send(HttpClient client, String method, String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .method(method, body == null
                        ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(body))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode json(HttpResponse<String> response, int expectedStatus) throws Exception {
        assertEquals(expectedStatus, response.statusCode(), response.body());
        return mapper.readTree(response.body());
    }

    private void assertError(HttpResponse<String> response, int status, String message) throws Exception {
        JsonNode error = json(response, status);
        assertEquals(status, error.path("status").intValue());
        assertEquals(message, error.path("message").textValue());
    }
}
