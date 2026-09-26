# Card Management

A local web application for managing cards for the **Steelbound Arena** card game. The current MVP provides a card list and Create, View, Edit, and Delete flows, including in-page delete confirmation and data validation.

## Stack

- Java 21 and Spring Boot 4.0.8
- Maven Wrapper, Spring Web MVC, Bean Validation, and Jackson
- Plain HTML/CSS/JavaScript served by Spring Boot
- JSON file persistence

## Prerequisites

- Git
- JDK 21, with `JAVA_HOME` pointing to the JDK installation and its `bin` directory on `PATH`
- PowerShell on Windows and a web browser
- Internet access for the first build to download Maven and dependencies

No global Maven installation, Node/npm, or database setup is required.

## Clone and configure

Run in PowerShell on Windows:

```powershell
git clone https://github.com/AndreiCorrea/card-management.git
cd card-management
java -version
javac -version
```

Both Java commands should report version 21. Run all commands below from the repository root. No additional configuration is required. Application settings, including port `8081`, are in [application.yaml](src/main/resources/application.yaml).

## Run

```powershell
.\mvnw.cmd spring-boot:run
```

Open [http://localhost:8081](http://localhost:8081). Use **Add** to create a card, or select a row to **View**, **Edit**, or **Delete** it. Stop the application with `Ctrl+C` in the terminal. Port `8081` must be available.

## Test

```powershell
.\mvnw.cmd clean test
```

The suite covers the card model, JSON repository, API operations, validation, error handling, and application context. Maven reports the result in the terminal and writes test reports to `target/surefire-reports/`.

## Data and images

Card data is persisted to `data/cards.json`, relative to the application's working directory. If missing, the directory and file are created automatically on the first write, such as saving a new card. Existing data is loaded on subsequent runs; no manual file initialization is needed. Back up `data/cards.json` if you want to preserve local card data.

Image selection currently stores only a filename reference in the card.

## Architecture

```text
Frontend
  -> CardController
  -> CardService
  -> CardRepository
  -> JsonCardRepository
  -> data/cards.json
```

The frontend lives in `src/main/resources/static/` and calls the REST API at `/api/cards`. The controller handles HTTP requests, the service coordinates card operations, and the repository implementation reads and writes JSON. Backend code is in `src/main/java/`; tests are in `src/test/java/`.

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for domain semantics, API details, and the project roadmap.

## Current limitations

- Image upload and storage are not implemented yet.
- Visual card rendering and card image downloads are not implemented yet.
- Persistence currently uses a JSON file rather than a database.

## Collaboration

- Pull the latest `main` before starting work.
- Use focused branches for isolated changes when useful.
- Do not commit generated build output such as `target/`.
