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
const editCardButton = document.querySelector("#edit-card-button");
const createTitle = document.querySelector("#create-title");
const createDescription = document.querySelector("#create-description");
const viewCardButton = document.querySelector("#view-card-button");
const cardDetailPanel = document.querySelector("#card-detail-panel");
const closeCardDetailButton = document.querySelector("#close-card-detail");
const cardDetailStatus = document.querySelector("#card-detail-status");
const cardDetailError = document.querySelector("#card-detail-error");
const cardDetailFields = document.querySelector("#card-detail-fields");

let selectedCardId = null;
let editingCardId = null;
let editingImageReference = null;
let formReturnButton = showCreateFormButton;

showCreateFormButton.addEventListener("click", () => {
    resetFormMode();
    formReturnButton = showCreateFormButton;
    createPanel.hidden = false;
    showCreateFormButton.setAttribute("aria-expanded", "true");
    createForm.elements.name.focus();
});

closeCreateFormButton.addEventListener("click", () => {
    hideCreateForm();
    formReturnButton.focus();
});

createForm.addEventListener("submit", submitCreateForm);
imageFileInput.addEventListener("change", updateSelectedImageName);
viewCardButton.addEventListener("click", loadSelectedCard);
editCardButton.addEventListener("click", loadSelectedCardForEdit);
closeCardDetailButton.addEventListener("click", closeCardDetails);

function showStatus(message, state = "") {
    listStatus.textContent = message;
    listStatus.className = `list-status${state ? ` is-${state}` : ""}`;
}

function renderCards(cards) {
    selectedCardId = null;
    viewCardButton.disabled = true;
    editCardButton.disabled = true;
    cardList.replaceChildren();

    for (const card of cards) {
        const row = document.createElement("tr");
        row.tabIndex = 0;
        row.setAttribute("aria-selected", "false");
        row.addEventListener("click", () => selectCardRow(row, card));
        row.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectCardRow(row, card);
            }
        });

        appendCell(row, card.id, "card-id");
        appendCell(row, card.name);
        appendCell(row, card.type, "card-type");
        appendCell(row, card.cost, "card-cost");

        cardList.append(row);
    }
}

function selectCardRow(row, card) {
    for (const otherRow of cardList.rows) {
        const isSelected = otherRow === row;
        otherRow.classList.toggle("is-selected", isSelected);
        otherRow.setAttribute("aria-selected", String(isSelected));
    }
    selectedCardId = card.id;
    viewCardButton.disabled = false;
    editCardButton.disabled = false;
}

async function loadSelectedCardForEdit() {
    if (selectedCardId === null || selectedCardId === undefined) {
        return;
    }

    try {
        const response = await fetch(`/api/cards/${encodeURIComponent(selectedCardId)}`, {
            headers: { Accept: "application/json" }
        });

        if (response.status === 404) {
            showStatus("This card is no longer available. Refresh the list and try again.", "error");
            return;
        }

        if (!response.ok) {
            showStatus("Unable to load this card for editing. Please try again later.", "error");
            return;
        }

        const card = await response.json();
        prepareEditForm(card);
    } catch {
        showStatus("Unable to load this card for editing. Please try again later.", "error");
    }
}

function prepareEditForm(card) {
    resetFormMode();
    editingCardId = card.id;
    editingImageReference = card.image ?? null;
    formReturnButton = editCardButton;

    const form = createForm.elements;
    form.name.value = card.name ?? "";
    form.description.value = card.description ?? "";
    form.type.value = card.type ?? "";
    form.cost.value = card.cost ?? "";
    form.attack.value = card.attack ?? "";
    form.defense.value = card.defense ?? "";
    form.piercing.value = card.piercing ?? "";
    form.durability.value = card.durability ?? "";
    form.twoHanded.checked = Boolean(card.twoHanded);
    form.magicDamage.value = card.magicDamage ?? "";
    form.magicResistance.value = card.magicResistance ?? "";
    form.shieldType.value = card.shieldType ?? "";
    form.parryBonus.value = card.parryBonus ?? "";
    updateSelectedImageName();

    createTitle.textContent = "Edit Card";
    createDescription.textContent = "Update the details for this card.";
    createPanel.hidden = false;
    clearCreateErrors();
    cardDetailPanel.hidden = true;
    createPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    form.name.focus();
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
    const selectedRow = cardList.querySelector("tr.is-selected");
    (selectedRow || viewCardButton).focus();
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
        editCardButton.disabled = true;
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
        image: imageFileInput.files[0]?.name || editingImageReference
    };

    const isEditing = editingCardId !== null;
    const endpoint = isEditing
        ? `/api/cards/${encodeURIComponent(editingCardId)}`
        : "/api/cards";

    try {
        const response = await fetch(endpoint, {
            method: isEditing ? "PUT" : "POST",
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

        if (isEditing && response.status === 404) {
            showCreateErrors({ message: "This card is no longer available. Refresh the list and try again." });
            return;
        }

        const expectedStatus = isEditing ? 200 : 201;
        if (response.status !== expectedStatus) {
            showCreateErrors({
                message: isEditing
                    ? "Unable to update the card. Please try again."
                    : "Unable to create the card. Please try again."
            });
            return;
        }

        const returnButton = isEditing ? showCreateFormButton : formReturnButton;
        hideCreateForm();
        returnButton.focus();
        await loadCards();
    } catch {
        showCreateErrors({
            message: isEditing
                ? "Unable to reach the server while updating. Please try again later."
                : "Unable to reach the server. Please try again later."
        });
    }
}

function optionalNumber(value) {
    return value === "" ? null : Number(value);
}

function updateSelectedImageName() {
    const selectedFileName = imageFileInput.files[0]?.name;
    if (selectedFileName) {
        editingImageReference = selectedFileName;
    }
    selectedImageName.textContent = selectedFileName || editingImageReference || "No image selected";
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
    resetFormMode();
    createPanel.hidden = true;
    showCreateFormButton.setAttribute("aria-expanded", "false");
}

function resetFormMode() {
    createForm.reset();
    editingCardId = null;
    editingImageReference = null;
    createTitle.textContent = "Create a Card";
    createDescription.textContent = "Enter the card details for the archive.";
    updateSelectedImageName();
    clearCreateErrors();
}

loadCards();
