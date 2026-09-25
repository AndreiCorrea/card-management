const cardList = document.querySelector("#card-list");
const listStatus = document.querySelector("#list-status");

function showStatus(message, state = "") {
    listStatus.textContent = message;
    listStatus.className = `list-status${state ? ` is-${state}` : ""}`;
}

function renderCards(cards) {
    cardList.replaceChildren();

    for (const card of cards) {
        const row = document.createElement("tr");

        appendCell(row, card.id, "card-id");
        appendCell(row, card.name);
        appendCell(row, card.type, "card-type");
        appendCell(row, card.cost, "card-cost");

        cardList.append(row);
    }
}

function appendCell(row, value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value ?? "—";
    if (className) {
        cell.className = className;
    }
    row.append(cell);
}

async function loadCards() {
    showStatus("Loading card archive…");

    try {
        const response = await fetch("/api/cards", {
            headers: { Accept: "application/json" }
        });

        if (!response.ok) {
            throw new Error("Card list request failed");
        }

        const cards = await response.json();
        if (!Array.isArray(cards)) {
            throw new Error("Card list response was invalid");
        }

        renderCards(cards);
        if (cards.length === 0) {
            showStatus("No cards have been registered yet.", "empty");
        } else {
            showStatus("");
        }
    } catch {
        cardList.replaceChildren();
        showStatus("Unable to load cards. Please try again later.", "error");
    }
}

loadCards();
