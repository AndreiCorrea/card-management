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
const deleteCardButton = document.querySelector("#delete-card-button");
const deleteConfirmationPanel = document.querySelector("#delete-confirmation-panel");
const deleteConfirmationName = document.querySelector("#delete-confirmation-name");
const deleteConfirmationError = document.querySelector("#delete-confirmation-error");
const confirmDeleteCardButton = document.querySelector("#confirm-delete-card");
const cancelDeleteCardButton = document.querySelector("#cancel-delete-card");

let selectedCardId = null;
let selectedCardName = null;
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
imageFileInput.addEventListener("change", updateSelectedImageName);
viewCardButton.addEventListener("click", loadSelectedCard);
editCardButton.addEventListener("click", loadSelectedCardForEdit);
closeCardDetailButton.addEventListener("click", closeCardDetails);
deleteCardButton.addEventListener("click", openDeleteConfirmation);
confirmDeleteCardButton.addEventListener("click", deleteSelectedCard);
cancelDeleteCardButton.addEventListener("click", cancelDeleteConfirmation);

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
    clearCardSelection();
    cardList.replaceChildren();

    for (const card of cards) {
        const row = document.createElement("tr");
        row.tabIndex = 0;
        row.setAttribute("aria-selected", "false");
        row.addEventListener("click", () => selectCardRow(row, card));
        row.addEventListener("keydown", event => {
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                const rows = Array.from(cardList.rows);
                const currentIndex = rows.indexOf(row);
                let targetIndex = currentIndex;

                if (event.key === "ArrowDown") {
                    targetIndex = Math.min(currentIndex + 1, rows.length - 1);
                } else if (event.key === "ArrowUp") {
                    targetIndex = Math.max(currentIndex - 1, 0);
                } else if (event.key === "Home") {
                    targetIndex = 0;
                } else if (event.key === "End") {
                    targetIndex = rows.length - 1;
                }

                event.preventDefault();
                if (targetIndex !== currentIndex) {
                    rows[targetIndex].focus();
                    selectCardRow(rows[targetIndex], cards[targetIndex]);
                }
                return;
            }

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
    if (deleteConfirmationPanel.hidden === false && pendingDeleteCard?.id !== card.id) {
        cancelDeleteConfirmation();
    }

    for (const otherRow of cardList.rows) {
        const isSelected = otherRow === row;
        otherRow.classList.toggle("is-selected", isSelected);
        otherRow.setAttribute("aria-selected", String(isSelected));
    }
    selectedCardId = card.id;
    selectedCardName = card.name;
    syncMainActionButtons();
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
        clearCardSelection();
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
    for (const row of cardList.rows) {
        row.classList.remove("is-selected");
        row.setAttribute("aria-selected", "false");
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
    createPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    form.name.focus();
}

async function loadSelectedCard() {
    if (activeMaintenanceOperation !== null || selectedCardId === null || selectedCardId === undefined) {
        return;
    }

    beginMaintenanceOperation("view");
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
    finishMaintenanceOperation();
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
        clearCardSelection();
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
