# Steelbound Arena — Card Management

A local web application for managing cards and decks for **Steelbound Arena**, a medieval duel card game. The application provides card CRUD, a searchable collection, visual card previews, and persistent deck composition.

## Technology

- Java 21
- Spring Boot 4.0.8 (Spring Web MVC and Bean Validation)
- Jackson 2.20.1 for JSON serialization
- Maven Wrapper
- Plain HTML, CSS, and JavaScript; no frontend framework or npm toolchain
- Local JSON file persistence

## Run on Windows

Prerequisites: JDK 21 and PowerShell. No global Maven installation or database is required. From the repository root:

```powershell
java -version
.\mvnw.cmd spring-boot:run
```

Open <http://localhost:8081>. The application port is configured as `8081` in [application.yaml](src/main/resources/application.yaml). Stop the server with `Ctrl+C`.

Run the automated test suite with:

```powershell
.\mvnw.cmd clean test
```

## Features

### Card Management

- Create, view, edit, and delete cards.
- Card types: Weapon, Shield, Armor, Accessory, Consumable, and Spell.
- Optional combat and defense attributes distinguish unset (`null`) values from numeric zero.
- Responsive Card Collection grid with local, multi-term name search and type filtering.
- Keyboard selection and navigation, plus Card Details with a reusable visual card preview.
- Add and Edit forms include a live preview.

### Deck Builder

- Create, list, open, edit, and delete decks.
- Edit deck name and optional description with unsaved-change protection.
- Browse available cards with local name search and type filtering; add cards to the open deck without changing the original card records.
- Remove individual card entries, including one copy at a time when a card appears more than once.
- Preserve card entry order and support multiple copies of the same card.
- Keep unavailable card references visible and removable after the referenced card is deleted.

## API

All endpoints return JSON except successful `DELETE` requests, which return `204 No Content`. Request validation and malformed JSON errors return `400`; missing cards or decks return `404`.

### Cards

| Method | Endpoint | Behavior |
|---|---|---|
| `POST` | `/api/cards` | Create a card; returns `201 Created` and a `Location` header. |
| `GET` | `/api/cards` | List cards. |
| `GET` | `/api/cards/{id}` | Retrieve one card. |
| `PUT` | `/api/cards/{id}` | Replace card fields. |
| `DELETE` | `/api/cards/{id}` | Delete a card; existing deck references are retained. |

Card request and response fields are `name`, `description`, `type`, `cost`, `attack`, `defense`, `piercing`, `durability`, `twoHanded`, `magicDamage`, `magicResistance`, `shieldType`, `parryBonus`, and `image`; responses also include `id`. Optional numeric attributes may be `null` or `0`. `image` is currently only a filename/reference, not an uploaded or served image.

### Decks

| Method | Endpoint | Behavior |
|---|---|---|
| `POST` | `/api/decks` | Create a deck; returns `201 Created` and a `Location` header. `cardIds` may be omitted for an empty deck. |
| `GET` | `/api/decks` | List summaries with `id`, `name`, `description`, and `cardCount`. |
| `GET` | `/api/decks/{id}` | Retrieve deck details with ordered `cards` entries. |
| `PUT` | `/api/decks/{id}` | Replace name, description, and the complete ordered `cardIds` list. `cardIds` is required; an empty list is valid. |
| `DELETE` | `/api/decks/{id}` | Delete a deck; returns `204 No Content`. |

Each deck detail entry contains `cardId`, `available`, and `card`. When the referenced card exists, `available` is `true` and `card` contains its current data. When it has been deleted, the entry remains in its original position with `available: false` and `card: null`. Duplicate IDs are represented as separate ordered entries.

Errors use `{ "status": ..., "message": ..., "errors": ... }`. Deck names are required and nonblank. New card references must point to existing cards; an existing unavailable reference can be retained or removed when updating a deck, but cannot be duplicated further.

## Persistence

- `data/cards.json` stores card records and the card ID high-water mark.
- `data/decks.json` stores deck records and an independent deck ID high-water mark.
- Both sequences start at `1` and advance independently; deleted IDs are not reused.
- Decks persist ordered `cardIds`, not copies of Card objects. Duplicate IDs represent multiple entries.
- Deleting a card does not rewrite deck files. The API resolves each reference when returning deck details and reports missing cards as unavailable.
- Data files are created on writes relative to the application working directory. Back up both files to preserve local cards and decks.

## Project structure

```text
src/main/java/.../card/       Card model, API, service, and JSON repository
src/main/java/.../deck/       Deck model, API, service, and JSON repository
src/main/java/.../card/exception/  Shared API exception handling
src/main/resources/static/    HTML, CSS, and JavaScript frontend
src/test/java/                Unit and HTTP integration tests
data/                         Local cards.json and decks.json files
```

## Current limitations

- Card images are filename references only; image upload, storage, and serving are not implemented.
- Deck rules, size limits, and gameplay validation are not implemented; the app stores and composes card entries.
- Persistence is local JSON file storage rather than a database.
