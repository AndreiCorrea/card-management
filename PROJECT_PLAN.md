# Card Management — Project Plan

## 1. Overview

`card-management` is a local web application for registering, maintaining, and consulting cards for a custom card game.

The game design already exists: concept, card model, rules, card definitions, lore, visual identity, and initial playtesting. This software project starts with the Card Manager MVP.

## 2. MVP Goals

The MVP must allow the user to:

- create a card;
- list cards;
- consult one card;
- edit a card;
- delete a card with confirmation;
- persist cards in JSON;
- validate card data;
- expose CRUD through a REST API;
- provide automated tests.

## 3. Out of Scope

Do not implement unless explicitly requested later:

- Game Engine;
- complete game-rule execution;
- card effects/rules engine;
- Deck Builder;
- deck persistence;
- final card visual template;
- PNG generation;
- printing;
- Tabletop Simulator export;
- authentication/authorization;
- SQL database;
- microservices;
- React/Angular/Vue;
- Node/npm frontend infrastructure.

Special effects that are not represented by current fields remain in `description` for now.

## 4. Technology Stack

### Backend
- Java 21 LTS
- Spring Boot 4.0.8
- Spring Web
- Jackson
- Bean Validation
- JUnit / Spring Boot testing support

### Build
- Maven
- Maven Wrapper is required
- Do not assume Maven is installed globally

On Windows use:

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
.\mvnw.cmd package
```

### Frontend
- HTML
- CSS
- Vanilla JavaScript
- Served by Spring Boot from `src/main/resources/static/`

Do not introduce a frontend framework or npm for the MVP.

## 5. Architecture

```text
Browser
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
JSON file
```

Recommended package areas:

```text
card/
├── controller
├── dto
├── model
├── repository
└── service

exception/
```

Responsibilities:

- Controller: HTTP only; must not access JSON directly.
- Service: application/business operations.
- Repository: persistence abstraction.
- JsonCardRepository: JSON implementation.

Use a `CardRepository` interface so a future SQL implementation can replace JSON without changing the service layer.

## 6. Domain Model

### Card

| Field | Type | Required | Meaning |
|---|---|---:|---|
| id | Long | yes | generated identifier |
| name | String | yes | card name |
| description | String | yes | behavior/lore |
| type | CardType | yes | card type |
| cost | Integer | yes | Skill Points required |
| attack | Integer | no | attack value |
| defense | Integer | no | defense value |
| piercing | Integer | no | defense ignored by attack |
| durability | Integer | no | durability |
| twoHanded | boolean | yes | requires two hands |
| magicDamage | Integer | no | magical damage |
| magicResistance | Integer | no | magical resistance |
| shieldType | ShieldType | no | shield behavior |
| parryBonus | Integer | no | parry bonus |
| image | String | no | image path/reference |

### CardType

```text
WEAPON
SHIELD
ARMOR
ACCESSORY
CONSUMABLE
SPELL
```

### ShieldType

```text
REGULAR
PARRYING
TOWER
```

## 7. Critical Domain Semantics

`null` and `0` are different.

- `null` = attribute is not defined / not applicable.
- `0` = attribute exists and currently has value zero.

Therefore optional numeric fields MUST use `Integer`, not primitive `int`.

`twoHanded` defaults to `false`.

Attributes are not exclusive to their "primary" card types. Do not add rules such as "only weapons can have attack" or "only shields can have shieldType". The Card Manager stores data; the future Game Engine interprets rules.

## 8. ID Strategy

For the MVP:

- type: `Long`;
- first ID: `1`;
- sequential;
- persist the next ID as a durable high-water mark;
- increment the high-water mark after each new card;
- deleting cards never decreases the high-water mark;
- deleted IDs are never reused.

Example: if 3 is deleted from `1,2,3,4`, the next card receives 5.

This may be changed in a future version if requirements justify another identifier.

## 9. Persistence

Use:

```text
data/cards.json
```

Example:

```json
{
  "nextId": 2,
  "cards": [
    {
      "id": 1,
      "name": "Example Sword",
      "description": "A simple sword.",
      "type": "WEAPON",
      "cost": 2,
      "attack": 3,
      "defense": null,
      "piercing": 1,
      "durability": 5,
      "twoHanded": false,
      "magicDamage": null,
      "magicResistance": null,
      "shieldType": null,
      "parryBonus": null,
      "image": "cards/example-sword.png"
    }
  ]
}
```

`nextId` is the next ID to assign. It starts at `1`, advances after each new card, and is not decreased when cards are deleted. For legacy JSON array files, derive it as the highest existing ID plus one and migrate to this object format on the next successful persistence operation. A JSON `null` root is invalid repository data.

The repository exclusively handles JSON persistence. Do not put `cards.json` under `src/main/resources`.

The image field stores only a path/reference, never binary image data.

## 10. DTOs

Recommended:

```text
CreateCardRequest
UpdateCardRequest
CardResponse
```

Keep DTO mapping simple. Do not introduce mapper frameworks unless justified.

## 11. REST API

```text
POST   /api/cards
GET    /api/cards
GET    /api/cards/{id}
PUT    /api/cards/{id}
DELETE /api/cards/{id}
```

Expected statuses:

- POST: `201 Created`
- GET list: `200 OK`
- GET one: `200 OK` / `404 Not Found`
- PUT: `200 OK` / `404 Not Found`
- DELETE: `204 No Content` / `404 Not Found`

Delete confirmation belongs to the frontend.

## 12. Validation

Use Bean Validation.

Required:

- `name`: not blank;
- `description`: not blank;
- `type`: not null;
- `cost`: not null, >= 0.

Optional numeric fields, when provided, must be >= 0:

- attack
- defense
- piercing
- durability
- magicDamage
- magicResistance
- parryBonus

`null` is valid. `0` is valid. Negative values are invalid.

Do not make `shieldType` mandatory based on `CardType`.

## 13. Error Handling

Use centralized exception handling.

At minimum:

- `CardNotFoundException` -> `404`;
- validation errors -> `400`.

Use a consistent error response, for example:

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "name": "Name is required",
    "cost": "Cost must be greater than or equal to 0"
  }
}
```

Do not expose stack traces/internal details in normal API responses.

## 14. Frontend

Initial structure:

```text
src/main/resources/static/
├── index.html
├── css/
│   └── styles.css
└── js/
    └── app.js
```

Initial maintenance screen:

- Include
- Alter
- Consult
- Delete

Use `fetch` to communicate with the REST API.

The MVP UI should prioritize functionality, clarity, and maintainability over visual sophistication.

## 15. CRUD Behavior

### Include
Form with all card fields -> `POST /api/cards`.

### Alter
Select existing card -> load values -> `PUT /api/cards/{id}`.

### Consult
Show card data read-only.

### Delete
Show card data -> explicit confirmation -> `DELETE /api/cards/{id}`.

## 16. Testing Strategy

### Service unit tests
Cover create, update, get, list, delete, not-found and ID generation.

### Repository integration tests
Cover JSON read/write/create/update/delete/persistence/ID generation.

Use isolated test files; never modify production `data/cards.json`.

### API/controller tests
Cover successful CRUD, validation errors, not-found responses, status codes, and response structure.

### CRUD flow
Cover:

```text
Create
 ↓
Read
 ↓
Update
 ↓
Read updated data
 ↓
Delete
 ↓
Confirm not found
```

## 17. Development Phases

### Phase 0 — Game Design
Already completed.

### Phase 1 — Card Manager MVP
Current phase: domain, repository, service, REST API, validation, exceptions, tests, frontend and CRUD.

### Phase 2 — Card Visual / Template Preview
Live visual card preview and reusable template.

### Phase 3 — Card Collection
Visual browsing, filters and search.

### Phase 4 — Deck Builder
Deck creation, card selection and persistence.

### Phase 5 — Card Generator
PNG export, printing and Tabletop Simulator assets.

### Phase 6 — Game Engine
Game state, turns, combat, rules and effects.

Do not implement future phases during the MVP.

## 18. Future Visual Architecture

Future direction:

```text
Card data
   ↓
Card Template / Renderer
   ↓
Browser Preview
   +
PNG Renderer
```

Do not implement this architecture prematurely in the MVP.

## 19. Rules for AI Coding Agents

1. Implement one Jira task at a time.
2. Read `PROJECT_PLAN.md` before coding.
3. Do not implement future phases unless explicitly requested.
4. Do not introduce technologies outside this plan without justification.
5. Do not silently change architecture.
6. Prefer simple solutions over unnecessary abstractions.
7. Preserve `null` versus `0`.
8. Do not invent card-type-exclusive rules.
9. Do not implement the Game Engine.
10. Do not create an effects/rules engine in the MVP.
11. Use Maven Wrapper (`mvnw` / `mvnw.cmd`).
12. Run relevant tests after meaningful implementation.
13. Keep changes focused on the current task.
14. State assumptions.
15. If ambiguity affects domain or architecture, ask before implementing.
16. Keep code readable and conventional because this is also a learning project.

## 20. Preferred AI Workflow

```text
Jira task
   ↓
Read PROJECT_PLAN.md
   ↓
Inspect existing code
   ↓
Explain intended changes
   ↓
Implement only the task
   ↓
Run tests
   ↓
Fix failures
   ↓
Summarize files/changes/tests/assumptions
   ↓
Human reviews code
   ↓
Next task
```

Completing one task does not authorize implementation of the next one.

## 21. MVP Definition of Done

The MVP is complete when:

- application starts successfully;
- frontend is served by Spring Boot;
- cards can be created;
- cards can be listed;
- cards can be consulted;
- cards can be edited;
- cards can be deleted with confirmation;
- data persists in `data/cards.json`;
- IDs follow the defined strategy;
- validation works;
- not-found handling works;
- API errors are consistent;
- service, repository, API and CRUD-flow tests exist;
- project builds/tests with Maven Wrapper;
- no future-phase functionality has been unnecessarily implemented.
