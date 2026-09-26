package com.andreicorrealemos.card_management.card.controller;

import com.andreicorrealemos.card_management.card.repository.CardRepository;
import com.andreicorrealemos.card_management.card.repository.JsonCardRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
class CardCrudIntegrationTest {
    @TempDir
    static Path temporaryDirectory;

    // Replace the production bean, not its behavior, before any HTTP requests run.
    @TestBean(methodName = "isolatedRepository", enforceOverride = true)
    private CardRepository cardRepository;

    @Value("${local.server.port}")
    private int port;

    private final ObjectMapper mapper = new ObjectMapper();

    static CardRepository isolatedRepository() {
        return new JsonCardRepository(dataFile());
    }

    private static Path dataFile() {
        return temporaryDirectory.resolve("data").resolve("cards.json");
    }

    @Test
    void completeCrudFlowPersistsThroughRealHttpAndIsolatedJson() throws Exception {
        assertInstanceOf(JsonCardRepository.class, cardRepository);
        assertFalse(Files.exists(dataFile()));

        try (HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build()) {
            assertEquals(mapper.createArrayNode(), json(send(client, "GET", "/api/cards", null), 200));
            assertFalse(Files.exists(dataFile()), "Listing must not initialize the data file");

            String payload = """
                    {
                      "name": "Training shield", "description": "A sturdy shield", "type": "SHIELD",
                      "cost": 0, "attack": 0, "defense": null, "piercing": null, "durability": 5,
                      "twoHanded": true, "magicDamage": null, "magicResistance": 0,
                      "shieldType": "TOWER", "parryBonus": null, "image": "shield.png"
                    }
                    """;
            HttpResponse<String> createdResponse = send(client, "POST", "/api/cards", payload);
            JsonNode created = json(createdResponse, 201);
            assertEquals(1L, created.path("id").longValue());
            String cardUrl = "/api/cards/" + created.path("id").longValue();
            assertEquals(cardUrl, createdResponse.headers().firstValue("Location").orElseThrow());
            ObjectNode expected = (ObjectNode) mapper.readTree(payload);
            expected.put("id", 1);
            assertEquals(expected, created);
            assertPersisted(expected);

            assertEquals(mapper.createArrayNode().add(expected), json(send(client, "GET", "/api/cards", null), 200));
            assertEquals(expected, json(send(client, "GET", cardUrl, null), 200));

            ObjectNode update = (ObjectNode) mapper.readTree(payload);
            update.put("name", "Updated shield");
            update.put("description", "Updated effect");
            update.putNull("attack");
            update.put("defense", 0);
            update.put("twoHanded", false);
            update.putNull("shieldType");
            update.putNull("image");
            expected = update.deepCopy().put("id", 1);
            assertEquals(expected, json(send(client, "PUT", cardUrl, update.toString()), 200));
            assertEquals(expected, json(send(client, "GET", cardUrl, null), 200));
            assertPersisted(expected);

            HttpResponse<String> deleted = send(client, "DELETE", cardUrl, null);
            assertEquals(204, deleted.statusCode());
            assertEquals("", deleted.body());
            JsonNode missing = json(send(client, "GET", cardUrl, null), 404);
            assertEquals(404, missing.path("status").intValue());
            assertEquals("Card not found", missing.path("message").textValue());
            assertEquals(mapper.createArrayNode(), json(send(client, "GET", "/api/cards", null), 200));
            JsonNode document = mapper.readTree(dataFile().toFile());
            assertEquals(mapper.createArrayNode(), document.get("cards"));
            assertEquals(2L, document.path("nextId").longValue());
        }
    }

    private HttpResponse<String> send(HttpClient client, String method, String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode json(HttpResponse<String> response, int expectedStatus) throws Exception {
        assertEquals(expectedStatus, response.statusCode(), response.body());
        return mapper.readTree(response.body());
    }

    private void assertPersisted(JsonNode expected) throws Exception {
        assertTrue(Files.isRegularFile(dataFile()));
        JsonNode document = mapper.readTree(dataFile().toFile());
        assertEquals(2L, document.path("nextId").longValue());
        assertEquals(mapper.createArrayNode().add(expected), document.get("cards"));
    }
}
