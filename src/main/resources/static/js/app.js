const cardList = document.querySelector("#card-list");
const listStatus = document.querySelector("#list-status");
const showCreateFormButton = document.querySelector("#show-create-form");
const createPanel = document.querySelector("#create-panel");
const createForm = document.querySelector("#create-card-form");
const closeCreateFormButton = document.querySelector("#close-create-form");
const createFormErrors = document.querySelector("#create-form-errors");
const createErrorList = document.querySelector("#create-error-list");
const imageFileInput = document.querySelector("#image-file");
const selectedImageName = document.querySelector("#selected-image-name");
const viewCardButton = document.querySelector("#view-card-button");
const cardDetailPanel = document.querySelector("#card-detail-panel");
const closeCardDetailButton = document.querySelector("#close-card-detail");
const cardDetailStatus = document.querySelector("#card-detail-status");
const cardDetailError = document.querySelector("#card-detail-error");
const cardDetailFields = document.querySelector("#card-detail-fields");

let selectedCardId = null;

showCreateFormButton.addEventListener("click", () => {
    createPanel.hidden = false;
    showCreateFormButton.setAttribute("aria-expanded", "true");
    createForm.elements.name.focus();
});

closeCreateFormButton.addEventListener("click", () => {
    hideCreateForm();
    showCreateFormButton.focus();
});

createForm.addEventListener("submit", submitCreateForm);
imageFileInput.addEventListener("change", updateSelectedImageName);
viewCardButton.addEventListener("click", loadSelectedCard);
closeCardDetailButton.addEventListener("click", closeCardDetails);

function showStatus(message, state = "") {
    listStatus.textContent = message;
    listStatus.className = `list-status${state ? ` is-${state}` : ""}`;
}

function renderCards(cards) {
    selectedCardId = null;
    viewCardButton.disabled = true;
    cardList.replaceChildren();

    for (const card of cards) {
        const row = document.createElement("tr");

        const selectionCell = document.createElement("td");
        selectionCell.className = "card-select";
        const selector = document.createElement("input");
        selector.type = "radio";
        selector.name = "selected-card";
        selector.value = String(card.id);
        selector.setAttribute("aria-label", `Select card ${card.name}`);
        selector.addEventListener("change", () => {
            selectedCardId = card.id;
            viewCardButton.disabled = false;
        });
        selectionCell.append(selector);
        row.append(selectionCell);

        appendCell(row, card.id, "card-id");
        appendCell(row, card.name);
        appendCell(row, card.type, "card-type");
        appendCell(row, card.cost, "card-cost");

        cardList.append(row);
    }
}

async function loadSelectedCard() {
    if (selectedCardId === null || selectedCardId === undefined) {
        return;
    }

    cardDetailPanel.hidden = false;
    cardDetailFields.hidden = true;
    cardDetailError.hidden = true;
    cardDetailStatus.hidden = false;
    cardDetailStatus.className = "list-status";
    cardDetailStatus.textContent = "Loading card details…";
    cardDetailPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
        const response = await fetch(`/api/cards/${encodeURIComponent(selectedCardId)}`, {
            headers: { Accept: "application/json" }
        });

        if (response.status === 404) {
            showCardDetailError("This card is no longer available. Refresh the list and try again.");
            return;
        }

        if (!response.ok) {
            showCardDetailError("Unable to load card details. Please try again later.");
            return;
        }

        const card = await response.json();
        renderCardDetails(card);
        cardDetailStatus.hidden = true;
    } catch {
        showCardDetailError("Unable to load card details. Please try again later.");
    }
}

function renderCardDetails(card) {
    const values = {
        "detail-id": card.id,
        "detail-name": card.name,
        "detail-description": card.description,
        "detail-type": card.type,
        "detail-cost": card.cost,
        "detail-attack": optionalDisplayValue(card.attack),
        "detail-defense": optionalDisplayValue(card.defense),
        "detail-piercing": optionalDisplayValue(card.piercing),
        "detail-durability": optionalDisplayValue(card.durability),
        "detail-two-handed": card.twoHanded ? "Yes" : "No",
        "detail-magic-damage": optionalDisplayValue(card.magicDamage),
        "detail-magic-resistance": optionalDisplayValue(card.magicResistance),
        "detail-shield-type": optionalDisplayValue(card.shieldType),
        "detail-parry-bonus": optionalDisplayValue(card.parryBonus),
        "detail-image": optionalDisplayValue(card.image)
    };

    for (const [id, value] of Object.entries(values)) {
        document.getElementById(id).textContent = value;
    }
    cardDetailFields.hidden = false;
}

function optionalDisplayValue(value) {
    return value === null || value === undefined ? "Not set" : String(value);
}

function showCardDetailError(message) {
    cardDetailStatus.hidden = true;
    cardDetailError.textContent = message;
    cardDetailError.hidden = false;
}

function closeCardDetails() {
    cardDetailPanel.hidden = true;
    cardDetailStatus.hidden = true;
    cardDetailError.hidden = true;
    cardDetailFields.hidden = true;
    const selectedRadio = cardList.querySelector('input[name="selected-card"]:checked');
    (selectedRadio || viewCardButton).focus();
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
        selectedCardId = null;
        viewCardButton.disabled = true;
        showStatus("Unable to load cards. Please try again later.", "error");
    }
}

async function submitCreateForm(event) {
    event.preventDefault();
    clearCreateErrors();

    if (!createForm.reportValidity()) {
        return;
    }

    const form = createForm.elements;
    const payload = {
        name: form.name.value,
        description: form.description.value,
        type: form.type.value,
        cost: Number(form.cost.value),
        attack: optionalNumber(form.attack.value),
        defense: optionalNumber(form.defense.value),
        piercing: optionalNumber(form.piercing.value),
        durability: optionalNumber(form.durability.value),
        twoHanded: form.twoHanded.checked,
        magicDamage: optionalNumber(form.magicDamage.value),
        magicResistance: optionalNumber(form.magicResistance.value),
        shieldType: form.shieldType.value || null,
        parryBonus: optionalNumber(form.parryBonus.value),
        image: form.image.files[0]?.name || null
    };

    try {
        const response = await fetch("/api/cards", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 400) {
            showCreateErrors(await readErrorResponse(response));
            return;
        }

        if (response.status !== 201) {
            showCreateErrors({ message: "Unable to create the card. Please try again." });
            return;
        }

        hideCreateForm();
        showCreateFormButton.focus();
        await loadCards();
    } catch {
        showCreateErrors({ message: "Unable to reach the server. Please try again later." });
    }
}

function optionalNumber(value) {
    return value === "" ? null : Number(value);
}

function updateSelectedImageName() {
    selectedImageName.textContent = imageFileInput.files[0]?.name || "No image selected";
}

async function readErrorResponse(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function showCreateErrors(errorResponse) {
    clearCreateErrors();

    const fieldErrors = errorResponse.errors && typeof errorResponse.errors === "object"
        ? Object.entries(errorResponse.errors)
        : [];

    if (fieldErrors.length === 0) {
        appendError(errorResponse.message || "Please check the card details and try again.");
    } else {
        for (const [field, message] of fieldErrors) {
            const label = field.replaceAll(/([A-Z])/g, " $1").toLowerCase();
            appendError(`${label}: ${message}`);
        }
    }

    createFormErrors.hidden = false;
    createFormErrors.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function appendError(message) {
    const item = document.createElement("li");
    item.textContent = message;
    createErrorList.append(item);
}

function clearCreateErrors() {
    createErrorList.replaceChildren();
    createFormErrors.hidden = true;
}

function hideCreateForm() {
    createForm.reset();
    updateSelectedImageName();
    clearCreateErrors();
    createPanel.hidden = true;
    showCreateFormButton.setAttribute("aria-expanded", "false");
}

loadCards();
