const cardList = document.querySelector("#card-list");
const listStatus = document.querySelector("#list-status");
const showCreateFormButton = document.querySelector("#show-create-form");
const createPanel = document.querySelector("#create-panel");
const createForm = document.querySelector("#create-card-form");
const closeCreateFormButton = document.querySelector("#close-create-form");
const saveCardButton = document.querySelector("#save-card-button");
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
const cardDetailMetadata = document.querySelector("#card-detail-metadata");
const cardPreview = document.querySelector("#card-preview");
const formCardPreview = document.querySelector("#form-card-preview");
const cardVisualTemplate = document.querySelector("#card-visual-template");
const collectionCardTemplate = document.querySelector("#collection-card-template");
const deleteCardButton = document.querySelector("#delete-card-button");
const deleteConfirmationPanel = document.querySelector("#delete-confirmation-panel");
const deleteConfirmationName = document.querySelector("#delete-confirmation-name");
const deleteConfirmationError = document.querySelector("#delete-confirmation-error");
const confirmDeleteCardButton = document.querySelector("#confirm-delete-card");
const cancelDeleteCardButton = document.querySelector("#cancel-delete-card");
const collectionSearch = document.querySelector("#collection-search");
const collectionTypeFilter = document.querySelector("#collection-type-filter");
const clearCollectionFiltersButton = document.querySelector("#clear-collection-filters");

let allCards = [];
let collectionLoadState = "loading";
let selectedCardId = null;
let selectedCardName = null;
let cardDetailsRequestSequence = 0;
let pendingCardDetailsId = null;
let renderedCardDetailsId = null;
let pendingDeleteCard = null;
let activeMaintenanceOperation = null;
let editingCardId = null;
let editingImageReference = null;
let formReturnButton = showCreateFormButton;

showCreateFormButton.addEventListener("click", () => {
    if (activeMaintenanceOperation !== null) {
        return;
    }

    beginMaintenanceOperation("create");
    resetFormMode();
    formReturnButton = showCreateFormButton;
    createPanel.hidden = false;
    renderFormCardPreview();
    showCreateFormButton.setAttribute("aria-expanded", "true");
    createForm.elements.name.focus();
});

closeCreateFormButton.addEventListener("click", () => {
    hideCreateForm();
    finishMaintenanceOperation();
    formReturnButton.focus();
});

createForm.addEventListener("submit", submitCreateForm);
createForm.addEventListener("keydown", handleFormKeyboardNavigation);
createForm.addEventListener("input", renderFormCardPreview);
createForm.addEventListener("change", renderFormCardPreview);
imageFileInput.addEventListener("change", updateSelectedImageName);
viewCardButton.addEventListener("click", loadSelectedCard);
editCardButton.addEventListener("click", loadSelectedCardForEdit);
closeCardDetailButton.addEventListener("click", closeCardDetails);
deleteCardButton.addEventListener("click", openDeleteConfirmation);
confirmDeleteCardButton.addEventListener("click", deleteSelectedCard);
cancelDeleteCardButton.addEventListener("click", cancelDeleteConfirmation);
collectionSearch.addEventListener("input", applyCollectionFilters);
collectionTypeFilter.addEventListener("change", applyCollectionFilters);
clearCollectionFiltersButton.addEventListener("click", () => {
    collectionSearch.value = "";
    collectionTypeFilter.value = "";
    applyCollectionFilters();
    collectionSearch.focus();
});

function showStatus(message, state = "") {
    listStatus.textContent = message;
    listStatus.className = `list-status${state ? ` is-${state}` : ""}`;
}

function handleFormKeyboardNavigation(event) {
    if (event.key !== "Enter" && event.key !== "Escape" && event.key !== "Esc") {
        return;
    }

    const fields = Array.from(createForm.elements).filter(control =>
        control instanceof HTMLInputElement && control.type !== "hidden"
        || control instanceof HTMLSelectElement
        || control instanceof HTMLTextAreaElement
    );
    const saveButton = createForm.querySelector('button[type="submit"]');
    const navigationControls = [...fields, closeCreateFormButton, saveButton];
    const currentIndex = navigationControls.indexOf(event.target);
    if (currentIndex < 0) {
        return;
    }

    if (event.key === "Enter") {
        if (!fields.includes(event.target) || event.target instanceof HTMLTextAreaElement) {
            return;
        }

        event.preventDefault();
        const fieldIndex = fields.indexOf(event.target);
        (fields[fieldIndex + 1] || saveButton)?.focus();
        return;
    }

    const previousControl = navigationControls[currentIndex - 1];
    if (previousControl) {
        event.preventDefault();
        previousControl.focus();
    }
}

function renderCards(cards) {
    cardList.replaceChildren();

    for (const card of cards) {
        const fragment = collectionCardTemplate.content.cloneNode(true);
        const item = fragment.querySelector(".collection-card");
        const button = fragment.querySelector(".collection-card__button");

        item.querySelector(".collection-card__name").textContent = card.name ?? "Unnamed Card";
        item.querySelector(".collection-card__type").textContent = String(card.type ?? "Unknown type").replaceAll("_", " ");
        item.querySelector(".collection-card__cost").textContent = card.cost === null || card.cost === undefined
            ? "—"
            : String(card.cost);

        const isSelected = cardIdsEqual(card.id, selectedCardId);
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));

        button.addEventListener("click", () => selectCollectionCard(button, card));
        button.addEventListener("dblclick", () => {
            selectCollectionCard(button, card);
            loadSelectedCard();
        });
        button.addEventListener("keydown", event => handleCollectionCardKeydown(event, button, cards));
        cardList.append(fragment);
    }
}

function applyCollectionFilters() {
    if (collectionLoadState !== "ready") {
        return;
    }

    const queryTerms = normalizeSearchText(collectionSearch.value).split(/\s+/).filter(Boolean);
    const selectedType = collectionTypeFilter.value;
    const visibleCards = allCards.filter(card => {
        const normalizedName = normalizeSearchText(card.name);
        const nameMatches = queryTerms.every(term => normalizedName.includes(term));
        const typeMatches = selectedType === "" || card.type === selectedType;
        return nameMatches && typeMatches;
    });

    if (selectedCardId !== null && selectedCardId !== undefined) {
        const selectedCard = visibleCards.find(card => cardIdsEqual(card.id, selectedCardId));
        if (selectedCard) {
            selectedCardName = selectedCard.name;
        } else {
            clearSelectionForFilteredCard();
        }
    }

    renderCards(visibleCards);
    if (allCards.length === 0) {
        showStatus("No cards have been registered yet.", "empty");
    } else if (visibleCards.length === 0) {
        showStatus("No cards match the current search and filters.", "no-results");
    } else {
        showStatus("");
    }
}

function normalizeSearchText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function clearSelectionForFilteredCard() {
    const filteredOutCardId = selectedCardId;
    if (deleteConfirmationPanel.hidden === false
        && cardIdsEqual(pendingDeleteCard?.id, filteredOutCardId)
        && !confirmDeleteCardButton.disabled) {
        hideDeleteConfirmation();
        finishMaintenanceOperation();
    }

    clearCardSelection();
    cardDetailsRequestSequence++;
    pendingCardDetailsId = null;
    renderedCardDetailsId = null;

    if (!cardDetailPanel.hidden) {
        cardPreview.hidden = true;
        cardDetailFields.hidden = true;
        cardDetailMetadata.hidden = true;
        cardDetailError.hidden = true;
        cardDetailStatus.className = "list-status";
        cardDetailStatus.textContent = "This card is no longer in the current results. Adjust or clear the filters to continue viewing cards.";
        cardDetailStatus.hidden = false;
    }
}

function cardIdsEqual(first, second) {
    return first !== null && first !== undefined
        && second !== null && second !== undefined
        && String(first) === String(second);
}

function selectCollectionCard(button, card) {
    if (deleteConfirmationPanel.hidden === false && pendingDeleteCard?.id !== card.id) {
        cancelDeleteConfirmation();
    }

    for (const otherButton of cardList.querySelectorAll(".collection-card__button")) {
        const isSelected = otherButton === button;
        otherButton.classList.toggle("is-selected", isSelected);
        otherButton.setAttribute("aria-pressed", String(isSelected));
    }
    selectedCardId = card.id;
    selectedCardName = card.name;
    syncMainActionButtons();
    if (!cardDetailPanel.hidden) {
        loadSelectedCard();
    }
}

function handleCollectionCardKeydown(event, button, cards) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        return;
    }

    const buttons = Array.from(cardList.querySelectorAll(".collection-card__button"));
    const currentIndex = buttons.indexOf(button);
    if (currentIndex < 0 || buttons.length === 0) {
        return;
    }

    let targetButton;
    if (event.key === "Home") {
        targetButton = buttons[0];
    } else if (event.key === "End") {
        targetButton = buttons[buttons.length - 1];
    } else {
        targetButton = findCardGridNeighbor(button, event.key, buttons);
    }

    event.preventDefault();
    if (!targetButton || targetButton === button) {
        return;
    }

    targetButton.focus();
    const targetCard = buttons.indexOf(targetButton);
    selectCollectionCard(targetButton, cards[targetCard]);
}

function findCardGridNeighbor(button, direction, buttons) {
    const rows = [];
    for (const cardButton of buttons) {
        const top = cardButton.getBoundingClientRect().top;
        let row = rows.find(candidate => Math.abs(candidate.top - top) <= 2);
        if (!row) {
            row = { top, buttons: [] };
            rows.push(row);
        }
        row.buttons.push(cardButton);
    }
    rows.sort((first, second) => first.top - second.top);

    const currentRowIndex = rows.findIndex(row => row.buttons.includes(button));
    const currentRow = rows[currentRowIndex];
    if (direction === "ArrowLeft" || direction === "ArrowRight") {
        const rowButtons = [...currentRow.buttons].sort((first, second) =>
            first.getBoundingClientRect().left - second.getBoundingClientRect().left
        );
        const index = rowButtons.indexOf(button);
        const horizontalNeighbor = rowButtons[index + (direction === "ArrowRight" ? 1 : -1)];
        if (horizontalNeighbor) {
            return horizontalNeighbor;
        }

        const adjacentRow = rows[currentRowIndex + (direction === "ArrowRight" ? 1 : -1)];
        if (!adjacentRow) {
            return button;
        }

        const adjacentRowButtons = [...adjacentRow.buttons].sort((first, second) =>
            first.getBoundingClientRect().left - second.getBoundingClientRect().left
        );
        return direction === "ArrowRight"
            ? adjacentRowButtons[0]
            : adjacentRowButtons[adjacentRowButtons.length - 1];
    }

    const targetRow = rows[currentRowIndex + (direction === "ArrowDown" ? 1 : -1)];
    if (!targetRow) {
        return button;
    }

    const currentCenter = button.getBoundingClientRect().left + button.getBoundingClientRect().width / 2;
    return targetRow.buttons.reduce((closest, candidate) => {
        const rect = candidate.getBoundingClientRect();
        const closestRect = closest.getBoundingClientRect();
        const candidateDistance = Math.abs(rect.left + rect.width / 2 - currentCenter);
        const closestDistance = Math.abs(closestRect.left + closestRect.width / 2 - currentCenter);
        return candidateDistance < closestDistance ? candidate : closest;
    });
}

function openDeleteConfirmation() {
    if (activeMaintenanceOperation !== null || selectedCardId === null || selectedCardId === undefined) {
        return;
    }

    beginMaintenanceOperation("delete");
    pendingDeleteCard = { id: selectedCardId, name: selectedCardName };
    deleteConfirmationName.textContent = selectedCardName ?? `#${selectedCardId}`;
    deleteConfirmationError.hidden = true;
    deleteConfirmationPanel.hidden = false;
    deleteConfirmationPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    cancelDeleteCardButton.focus();
}

async function deleteSelectedCard() {
    if (!pendingDeleteCard || confirmDeleteCardButton.disabled) {
        return;
    }

    confirmDeleteCardButton.disabled = true;
    cancelDeleteCardButton.disabled = true;
    deleteConfirmationError.hidden = true;

    try {
        const response = await fetch(`/api/cards/${encodeURIComponent(pendingDeleteCard.id)}`, {
            method: "DELETE",
            headers: { Accept: "application/json" }
        });

        if (response.status === 404) {
            showDeleteConfirmationError("This card is no longer available. Refresh the list and try again.");
            return;
        }

        if (!response.ok) {
            showDeleteConfirmationError("Unable to delete the card. Please try again later.");
            return;
        }

        hideDeleteConfirmation();
        await loadCards();
        finishMaintenanceOperation();
        showCreateFormButton.focus();
    } catch {
        showDeleteConfirmationError("Unable to delete the card. Please try again later.");
    } finally {
        confirmDeleteCardButton.disabled = false;
        cancelDeleteCardButton.disabled = false;
    }
}

function showDeleteConfirmationError(message) {
    deleteConfirmationError.textContent = message;
    deleteConfirmationError.hidden = false;
}

function closeDeleteConfirmation() {
    hideDeleteConfirmation();
    finishMaintenanceOperation();
}

function hideDeleteConfirmation() {
    deleteConfirmationPanel.hidden = true;
    pendingDeleteCard = null;
    deleteConfirmationError.hidden = true;
}

function cancelDeleteConfirmation() {
    if (cancelDeleteCardButton.disabled) {
        return;
    }

    closeDeleteConfirmation();
    deleteCardButton.focus();
}

function clearCardSelection() {
    selectedCardId = null;
    selectedCardName = null;
    for (const button of cardList.querySelectorAll(".collection-card__button")) {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
    }
    syncMainActionButtons();
}

function beginMaintenanceOperation(operation) {
    activeMaintenanceOperation = operation;
    syncMainActionButtons();
}

function finishMaintenanceOperation() {
    activeMaintenanceOperation = null;
    syncMainActionButtons();
}

function syncMainActionButtons() {
    const locked = activeMaintenanceOperation !== null;
    const hasSelection = selectedCardId !== null && selectedCardId !== undefined;
    showCreateFormButton.disabled = locked;
    editCardButton.disabled = locked || !hasSelection;
    viewCardButton.disabled = locked || !hasSelection;
    deleteCardButton.disabled = locked || !hasSelection;
}

async function loadSelectedCardForEdit() {
    if (activeMaintenanceOperation !== null || selectedCardId === null || selectedCardId === undefined) {
        return;
    }

    beginMaintenanceOperation("edit-loading");
    try {
        const response = await fetch(`/api/cards/${encodeURIComponent(selectedCardId)}`, {
            headers: { Accept: "application/json" }
        });

        if (response.status === 404) {
            showStatus("This card is no longer available. Refresh the list and try again.", "error");
            finishMaintenanceOperation();
            return;
        }

        if (!response.ok) {
            showStatus("Unable to load this card for editing. Please try again later.", "error");
            finishMaintenanceOperation();
            return;
        }

        const card = await response.json();
        prepareEditForm(card);
    } catch {
        showStatus("Unable to load this card for editing. Please try again later.", "error");
        finishMaintenanceOperation();
    }
}

function prepareEditForm(card) {
    resetFormMode();
    editingCardId = card.id;
    activeMaintenanceOperation = "edit";
    syncMainActionButtons();
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
    renderFormCardPreview();
    createPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    form.name.focus();
}

async function loadSelectedCard() {
    const panelAlreadyOpen = !cardDetailPanel.hidden;
    const canRefreshOpenView = panelAlreadyOpen && activeMaintenanceOperation === "view";
    if ((activeMaintenanceOperation !== null && !canRefreshOpenView)
        || selectedCardId === null || selectedCardId === undefined) {
        return;
    }

    const requestedCardId = selectedCardId;
    const requestedCardKey = String(requestedCardId);
    if (panelAlreadyOpen && (renderedCardDetailsId === requestedCardKey
        || pendingCardDetailsId === requestedCardKey)) {
        return;
    }

    if (!panelAlreadyOpen) {
        beginMaintenanceOperation("view");
        cardDetailPanel.hidden = false;
        cardDetailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const requestSequence = ++cardDetailsRequestSequence;
    pendingCardDetailsId = requestedCardKey;
    renderedCardDetailsId = null;
    cardDetailFields.hidden = true;
    cardDetailMetadata.hidden = true;
    cardPreview.hidden = true;
    cardDetailError.hidden = true;
    cardDetailStatus.hidden = false;
    cardDetailStatus.className = "list-status";
    cardDetailStatus.textContent = "Loading card details…";

    try {
        const response = await fetch(`/api/cards/${encodeURIComponent(requestedCardId)}`, {
            headers: { Accept: "application/json" }
        });

        if (!isCurrentCardDetailsRequest(requestSequence, requestedCardKey)) {
            return;
        }

        if (response.status === 404) {
            pendingCardDetailsId = null;
            showCardDetailError("This card is no longer available. Refresh the list and try again.");
            return;
        }

        if (!response.ok) {
            pendingCardDetailsId = null;
            showCardDetailError("Unable to load card details. Please try again later.");
            return;
        }

        const card = await response.json();
        if (!isCurrentCardDetailsRequest(requestSequence, requestedCardKey)) {
            return;
        }
        if (card.id === null || card.id === undefined || String(card.id) !== requestedCardKey) {
            pendingCardDetailsId = null;
            showCardDetailError("Unable to load card details. Please try again later.");
            return;
        }

        renderCardDetails(card);
        pendingCardDetailsId = null;
        renderedCardDetailsId = requestedCardKey;
        cardDetailStatus.hidden = true;
    } catch {
        if (!isCurrentCardDetailsRequest(requestSequence, requestedCardKey)) {
            return;
        }
        pendingCardDetailsId = null;
        showCardDetailError("Unable to load card details. Please try again later.");
    }
}

function isCurrentCardDetailsRequest(requestSequence, requestedCardKey) {
    return requestSequence === cardDetailsRequestSequence
        && String(selectedCardId) === requestedCardKey
        && !cardDetailPanel.hidden;
}

function renderCardDetails(card) {
    renderCardTemplate(cardPreview, card);
    const values = {
        "detail-id": card.id,
        "detail-image": card.image === null || card.image === undefined ? "Not set" : String(card.image)
    };

    for (const [id, value] of Object.entries(values)) {
        document.getElementById(id).textContent = value;
    }
    cardDetailFields.hidden = false;
    cardDetailMetadata.hidden = false;
}

function renderCardTemplate(root, card) {
    const fragment = cardVisualTemplate.content.cloneNode(true);
    root.replaceChildren(fragment);

    const name = root.querySelector(".game-card-visual__name");
    const cost = root.querySelector(".game-card-visual__cost");
    const type = root.querySelector(".game-card-visual__type");
    const description = root.querySelector(".game-card-visual__description");
    const attributes = root.querySelector(".game-card-visual__attributes");
    const traitsElement = root.querySelector(".game-card-visual__traits");

    name.textContent = card.name ?? "Unnamed Card";
    cost.textContent = card.cost === null || card.cost === undefined ? "—" : String(card.cost);
    type.textContent = String(card.type ?? "Unknown type").replaceAll("_", " ");
    description.textContent = card.description ?? "";

    const values = [
        ["Attack", card.attack], ["Defense", card.defense], ["Piercing", card.piercing],
        ["Durability", card.durability], ["Magic Damage", card.magicDamage],
        ["Magic Resistance", card.magicResistance], ["Parry Bonus", card.parryBonus]
    ];
    for (const [label, value] of values) {
        if (value === null || value === undefined) continue;
        const item = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = String(value);
        item.append(term, description);
        attributes.append(item);
    }

    const traits = [];
    if (card.twoHanded) traits.push("Two-handed");
    if (card.shieldType !== null && card.shieldType !== undefined) {
        traits.push(`Shield: ${String(card.shieldType).replaceAll("_", " ")}`);
    }
    traitsElement.textContent = traits.join(" · ");
    traitsElement.hidden = traits.length === 0;
    root.hidden = false;
}

function renderFormCardPreview() {
    const form = createForm.elements;
    const previewCard = {
        name: form.name.value || null,
        description: form.description.value,
        type: form.type.value || null,
        cost: previewNumber(form.cost.value),
        attack: previewNumber(form.attack.value),
        defense: previewNumber(form.defense.value),
        piercing: previewNumber(form.piercing.value),
        durability: previewNumber(form.durability.value),
        twoHanded: form.twoHanded.checked,
        magicDamage: previewNumber(form.magicDamage.value),
        magicResistance: previewNumber(form.magicResistance.value),
        shieldType: form.shieldType.value || null,
        parryBonus: previewNumber(form.parryBonus.value)
    };
    renderCardTemplate(formCardPreview, previewCard);
}

function previewNumber(value) {
    if (value.trim() === "") {
        return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function showCardDetailError(message) {
    cardDetailStatus.hidden = true;
    cardDetailError.textContent = message;
    cardDetailError.hidden = false;
}

function closeCardDetails() {
    cardDetailsRequestSequence++;
    pendingCardDetailsId = null;
    renderedCardDetailsId = null;
    cardDetailPanel.hidden = true;
    cardDetailStatus.hidden = true;
    cardDetailError.hidden = true;
    cardDetailFields.hidden = true;
    cardDetailMetadata.hidden = true;
    cardPreview.hidden = true;
    finishMaintenanceOperation();
    const selectedButton = cardList.querySelector(".collection-card__button.is-selected");
    (selectedButton || collectionSearch || collectionTypeFilter || viewCardButton).focus();
}

async function loadCards() {
    collectionLoadState = "loading";
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

        allCards = cards;
        collectionLoadState = "ready";
        applyCollectionFilters();
    } catch {
        allCards = [];
        collectionLoadState = "error";
        cardList.replaceChildren();
        if (selectedCardId !== null && selectedCardId !== undefined) {
            clearSelectionForFilteredCard();
        } else {
            clearCardSelection();
        }
        showStatus("Unable to load cards. Please try again later.", "error");
    }
}

async function submitCreateForm(event) {
    event.preventDefault();
    if (saveCardButton.disabled) {
        return;
    }

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

    saveCardButton.disabled = true;
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
        await loadCards();
        finishMaintenanceOperation();
        returnButton.focus();
    } catch {
        showCreateErrors({
            message: isEditing
                ? "Unable to reach the server while updating. Please try again later."
                : "Unable to reach the server. Please try again later."
        });
    } finally {
        saveCardButton.disabled = false;
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

syncMainActionButtons();
loadCards();
