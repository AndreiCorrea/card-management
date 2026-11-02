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
const cardCollectionSection = document.querySelector("#card-collection-section");
const deckBuilderSection = document.querySelector("#deck-builder-section");
const showCardCollectionButton = document.querySelector("#show-card-collection");
const showDeckBuilderButton = document.querySelector("#show-deck-builder");
const newDeckButton = document.querySelector("#new-deck-button");
const deckCreateForm = document.querySelector("#deck-create-form");
const deckNameInput = document.querySelector("#deck-name-input");
const deckDescriptionInput = document.querySelector("#deck-description-input");
const deckCreateError = document.querySelector("#deck-create-error");
const submitCreateDeckButton = document.querySelector("#submit-create-deck");
const cancelCreateDeckButton = document.querySelector("#cancel-create-deck");
const deckFeedback = document.querySelector("#deck-feedback");
const deckListStatus = document.querySelector("#deck-list-status");
const retryLoadDecksButton = document.querySelector("#retry-load-decks");
const deckListEmpty = document.querySelector("#deck-list-empty");
const deckList = document.querySelector("#deck-list");
const deckWorkspaceStatus = document.querySelector("#deck-workspace-status");
const deckWorkspaceDetails = document.querySelector("#deck-workspace-details");
const deckOpenName = document.querySelector("#deck-open-name");
const deckOpenCardCount = document.querySelector("#deck-open-card-count");
const deckUnsavedIndicator = document.querySelector("#deck-unsaved-indicator");
const deckMetadataForm = document.querySelector("#deck-metadata-form");
const deckDraftNameInput = document.querySelector("#deck-draft-name");
const deckDraftDescriptionInput = document.querySelector("#deck-draft-description");
const deckMetadataError = document.querySelector("#deck-metadata-error");
const deckMetadataFeedback = document.querySelector("#deck-metadata-feedback");
const saveDeckChangesButton = document.querySelector("#save-deck-changes");
const deckEntryList = document.querySelector("#deck-entry-list");
const deckEntryEmpty = document.querySelector("#deck-entry-empty");
const deckBrowserControls = document.querySelector("#deck-browser-controls");
const deckBrowserSearch = document.querySelector("#deck-browser-search");
const deckBrowserTypeFilter = document.querySelector("#deck-browser-type-filter");
const clearDeckBrowserFiltersButton = document.querySelector("#clear-deck-browser-filters");
const deckBrowserStatus = document.querySelector("#deck-browser-status");
const deckBrowserList = document.querySelector("#deck-browser-list");
const deckBrowserCardTemplate = document.querySelector("#deck-browser-card-template");

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
let deckSummaries = [];
let openedDeck = null;
let deckListRequestSequence = 0;
let deckDetailRequestSequence = 0;
let deckListState = "not-loaded";
let pendingDeleteDeckId = null;
let deckDraft = null;
let deckMetadataSaving = false;

showCardCollectionButton.addEventListener("click", () => setActiveSection("collection"));
showDeckBuilderButton.addEventListener("click", () => setActiveSection("decks"));
newDeckButton.addEventListener("click", showDeckCreateForm);
cancelCreateDeckButton.addEventListener("click", hideDeckCreateForm);
deckCreateForm.addEventListener("submit", submitDeckCreateForm);
deckList.addEventListener("click", handleDeckListClick);
retryLoadDecksButton.addEventListener("click", loadDeckSummaries);
deckMetadataForm.addEventListener("submit", saveDeckMetadata);
deckDraftNameInput.addEventListener("input", updateDeckDraftFromForm);
deckDraftDescriptionInput.addEventListener("input", updateDeckDraftFromForm);
deckEntryList.addEventListener("click", handleDeckEntryClick);
deckBrowserSearch.addEventListener("input", renderDeckCardBrowser);
deckBrowserTypeFilter.addEventListener("change", renderDeckCardBrowser);
clearDeckBrowserFiltersButton.addEventListener("click", () => {
    deckBrowserSearch.value = "";
    deckBrowserTypeFilter.value = "";
    renderDeckCardBrowser();
    deckBrowserSearch.focus();
});
deckBrowserList.addEventListener("click", handleDeckBrowserClick);

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

function setActiveSection(section) {
    const showCollection = section === "collection";
    if (showCollection && isDeckDraftDirty() && !confirmDiscardDeckDraft()) {
        return;
    }
    const wasDeckBuilderVisible = !deckBuilderSection.hidden;
    cardCollectionSection.hidden = !showCollection;
    deckBuilderSection.hidden = showCollection;
    showCardCollectionButton.classList.toggle("is-active", showCollection);
    showDeckBuilderButton.classList.toggle("is-active", !showCollection);
    showCardCollectionButton.setAttribute("aria-pressed", String(showCollection));
    showDeckBuilderButton.setAttribute("aria-pressed", String(!showCollection));
    if (!showCollection && !wasDeckBuilderVisible) {
        loadDeckSummaries();
    }
}

async function loadDeckSummaries() {
    const requestSequence = ++deckListRequestSequence;
    deckListState = "loading";
    setDeckListStatus("Loading saved decks...");
    syncDeckListStates();

    try {
        const response = await fetch("/api/decks", {
            headers: { Accept: "application/json" }
        });
        if (!response.ok) {
            throw new Error("Deck list request failed");
        }

        const summaries = await response.json();
        if (!Array.isArray(summaries)) {
            throw new Error("Deck list response was invalid");
        }
        if (requestSequence !== deckListRequestSequence) {
            return false;
        }

        deckSummaries = summaries;
        deckListState = "ready";
        renderDeckList();
        setDeckListStatus("");
        return true;
    } catch {
        if (requestSequence !== deckListRequestSequence) {
            return false;
        }
        deckListState = "error";
        setDeckListStatus("Unable to load saved decks. Please try again.", "error");
        syncDeckListStates();
        return false;
    }
}

function setDeckListStatus(message, state = "") {
    deckListStatus.textContent = message;
    deckListStatus.className = `deck-list-status${state ? ` is-${state}` : ""}`;
    deckListStatus.hidden = message === "";
}

function renderDeckList() {
    deckList.replaceChildren();

    for (const deck of deckSummaries) {
        const item = document.createElement("li");
        item.className = "deck-list-entry";
        const isOpen = openedDeck !== null && String(openedDeck.id) === String(deck.id);
        item.classList.toggle("is-open", isOpen);

        const copy = document.createElement("div");
        copy.className = "deck-list-entry__copy";
        const name = document.createElement("h4");
        name.textContent = deck.name ?? "Unnamed Deck";
        copy.append(name);

        if (deck.description) {
            const description = document.createElement("p");
            description.className = "deck-list-entry__description";
            description.textContent = deck.description;
            copy.append(description);
        }

        const count = Number.isInteger(deck.cardCount) ? deck.cardCount : 0;
        const countLabel = document.createElement("p");
        countLabel.className = "deck-list-entry__count";
        countLabel.textContent = `${count} ${count === 1 ? "card entry" : "card entries"}`;
        copy.append(countLabel);

        const actions = document.createElement("div");
        actions.className = "deck-list-entry__actions";
        const openButton = document.createElement("button");
        openButton.className = "action-button deck-entry-button";
        openButton.type = "button";
        openButton.dataset.action = "open";
        openButton.dataset.deckId = String(deck.id);
        openButton.setAttribute("aria-pressed", String(isOpen));
        openButton.textContent = isOpen ? "Opened" : "Open";
        const deleteButton = document.createElement("button");
        deleteButton.className = "action-button deck-entry-button";
        deleteButton.type = "button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.deckId = String(deck.id);
        deleteButton.textContent = "Delete";
        const isDeleting = pendingDeleteDeckId !== null && String(pendingDeleteDeckId) === String(deck.id);
        openButton.disabled = isDeleting;
        deleteButton.disabled = isDeleting;
        actions.append(openButton, deleteButton);

        item.append(copy, actions);
        deckList.append(item);
    }

    syncDeckListStates();
}

function syncDeckListStates() {
    const hasDecks = deckSummaries.length > 0;
    deckList.hidden = !hasDecks;
    deckListEmpty.hidden = deckListState !== "ready" || hasDecks;
    retryLoadDecksButton.hidden = deckListState !== "error" || hasDecks;
}

function showDeckCreateForm() {
    if (isDeckDraftDirty() && !confirmDiscardDeckDraft()) {
        return;
    }
    deckCreateForm.reset();
    deckCreateError.textContent = "";
    deckCreateError.hidden = true;
    deckFeedback.hidden = true;
    deckCreateForm.hidden = false;
    newDeckButton.disabled = true;
    deckNameInput.focus();
}

function hideDeckCreateForm() {
    if (submitCreateDeckButton.disabled) {
        return;
    }
    deckCreateForm.reset();
    deckCreateError.textContent = "";
    deckCreateError.hidden = true;
    deckCreateForm.hidden = true;
    newDeckButton.disabled = false;
    newDeckButton.focus();
}

async function submitDeckCreateForm(event) {
    event.preventDefault();
    if (submitCreateDeckButton.disabled || !deckCreateForm.reportValidity()) {
        return;
    }

    const name = deckNameInput.value.trim();
    if (name === "") {
        showDeckCreateError("Deck name must not be blank.");
        deckNameInput.focus();
        return;
    }

    const description = deckDescriptionInput.value.trim();
    const payload = { name };
    if (description !== "") {
        payload.description = description;
    }

    submitCreateDeckButton.disabled = true;
    cancelCreateDeckButton.disabled = true;
    deckCreateError.hidden = true;
    deckFeedback.hidden = true;
    try {
        const response = await fetch("/api/decks", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (response.status !== 201) {
            const error = await readErrorResponse(response);
            showDeckCreateError(deckErrorMessage(error, "Unable to create the deck. Please try again."));
            return;
        }

        const createdDeck = await response.json();
        if (!createdDeck || createdDeck.id === null || createdDeck.id === undefined || !Array.isArray(createdDeck.cards)) {
            throw new Error("Deck create response was invalid");
        }

        deckCreateForm.hidden = true;
        newDeckButton.disabled = false;
        deckCreateForm.reset();
        resetDeckBrowserFilters();
        deckDetailRequestSequence++;
        deckDraft = null;
        openedDeck = createdDeck;
        renderOpenedDeck();
        const refreshed = await loadDeckSummaries();
        renderDeckList();
        showDeckFeedback(refreshed ? "Deck created and opened." : "Deck created and opened, but the saved deck list could not be refreshed.", refreshed ? "success" : "error");
    } catch {
        showDeckCreateError("Unable to reach the server or read the deck response. Your entries are still here; please try again.");
    } finally {
        submitCreateDeckButton.disabled = false;
        cancelCreateDeckButton.disabled = false;
    }
}

function showDeckCreateError(message) {
    deckCreateError.textContent = message;
    deckCreateError.hidden = false;
}

function showDeckFeedback(message, state = "") {
    deckFeedback.textContent = message;
    deckFeedback.className = `deck-feedback${state ? ` is-${state}` : ""}`;
    deckFeedback.hidden = message === "";
}

function deckErrorMessage(error, fallback) {
    if (typeof error.message === "string" && error.message.trim() !== "") {
        return error.message;
    }
    if (error.errors && typeof error.errors === "object") {
        return Object.values(error.errors).filter(value => typeof value === "string").join(" ") || fallback;
    }
    return fallback;
}

function handleDeckListClick(event) {
    const button = event.target.closest("button[data-action][data-deck-id]");
    if (!button || !deckList.contains(button) || pendingDeleteDeckId !== null) {
        return;
    }

    const deckId = button.dataset.deckId;
    const deck = deckSummaries.find(summary => String(summary.id) === deckId);
    if (!deck) {
        return;
    }
    if (button.dataset.action === "open") {
        openDeck(deck.id);
    } else if (button.dataset.action === "delete") {
        deleteDeck(deck.id, deck.name ?? "Unnamed Deck");
    }
}

async function openDeck(deckId) {
    if (openedDeck !== null && String(openedDeck.id) === String(deckId)) {
        return;
    }
    if (isDeckDraftDirty() && !confirmDiscardDeckDraft()) {
        return;
    }

    resetDeckBrowserFilters();
    const requestSequence = ++deckDetailRequestSequence;
    openedDeck = null;
    deckDraft = null;
    renderDeckList();
    deckWorkspaceDetails.hidden = true;
    setDeckWorkspaceStatus("Loading deck details...");
    renderDeckCardBrowser();
    try {
        const response = await fetch(`/api/decks/${encodeURIComponent(deckId)}`, {
            headers: { Accept: "application/json" }
        });
        if (!response.ok) {
            throw new Error(response.status === 404 ? "This deck no longer exists." : "Unable to load this deck. Please try again.");
        }
        const deck = await response.json();
        if (!deck || !Array.isArray(deck.cards)) {
            throw new Error("Deck response was invalid");
        }
        if (requestSequence !== deckDetailRequestSequence) {
            return;
        }
        openedDeck = deck;
        initializeDeckDraft(deck);
        renderOpenedDeck();
    } catch (error) {
        if (requestSequence !== deckDetailRequestSequence) {
            return;
        }
        openedDeck = null;
        renderDeckList();
        setDeckWorkspaceStatus(error instanceof Error && error.message !== "Deck response was invalid"
            ? error.message
            : "Unable to load this deck. Please try again.", "error");
    }
}

function renderOpenedDeck() {
    if (openedDeck === null) {
        deckWorkspaceDetails.hidden = true;
        setDeckWorkspaceStatus("Choose a saved deck to view its details.");
        renderDeckList();
        return;
    }

    if (deckDraft === null) {
        initializeDeckDraft(openedDeck);
    }
    deckOpenName.textContent = deckDraft.name.trim() || "Unnamed Deck";
    deckOpenCardCount.textContent = `${deckDraft.cardIds.length} ${deckDraft.cardIds.length === 1 ? "card entry" : "card entries"}`;
    deckDraftNameInput.value = deckDraft.name;
    deckDraftDescriptionInput.value = deckDraft.description;
    deckMetadataForm.hidden = false;
    renderDeckEntries();
    deckWorkspaceStatus.hidden = true;
    deckWorkspaceDetails.hidden = false;
    updateDeckDraftIndicators();
    renderDeckList();
}

function initializeDeckDraft(deck) {
    const name = typeof deck.name === "string" ? deck.name : "";
    const description = typeof deck.description === "string" ? deck.description : "";
    const entries = Array.isArray(deck.cards)
        ? deck.cards.map(entry => ({
            cardId: entry.cardId,
            available: entry.available === true && entry.card !== null,
            card: entry.card ? { ...entry.card } : null
        }))
        : [];
    const cardIds = entries.map(entry => entry.cardId);
    deckDraft = {
        original: { name, description, cardIds: cardIds.slice() },
        name,
        description,
        cardIds: cardIds.slice(),
        entries
    };
    deckDraftNameInput.value = name;
    deckDraftDescriptionInput.value = description;
    deckMetadataError.textContent = "";
    deckMetadataError.hidden = true;
    deckUnsavedIndicator.hidden = true;
    saveDeckChangesButton.disabled = true;
    renderDeckCardBrowser();
}

function renderDeckEntries() {
    deckEntryList.replaceChildren();
    if (deckDraft === null) {
        deckEntryEmpty.hidden = true;
        return;
    }

    deckDraft.entries.forEach((entry, index) => {
        const item = document.createElement("li");
        item.className = "deck-entry-item";

        if (entry.available === true && entry.card) {
            const card = entry.card;
            const preview = document.createElement("div");
            preview.className = "deck-entry-card";
            const artwork = document.createElement("span");
            artwork.className = "collection-card__art deck-entry-card__art";
            artwork.setAttribute("aria-hidden", "true");
            const mark = document.createElement("span");
            mark.className = "collection-card__mark";
            mark.textContent = "SA";
            artwork.append(mark);
            const identity = document.createElement("span");
            identity.className = "collection-card__identity";
            const name = document.createElement("span");
            name.className = "collection-card__name";
            name.textContent = card.name ?? "Unnamed Card";
            const type = document.createElement("span");
            type.className = "collection-card__type";
            type.textContent = String(card.type ?? "Unknown type").replaceAll("_", " ");
            identity.append(name, type);
            const cost = document.createElement("span");
            cost.className = "collection-card__cost";
            cost.textContent = card.cost === null || card.cost === undefined ? "—" : String(card.cost);
            const removeButton = createDeckEntryRemoveButton(index, `Remove ${card.name ?? "card"} entry ${index + 1}`);
            preview.append(artwork, identity, cost, removeButton);
            item.append(preview);
        } else {
            const unavailable = document.createElement("div");
            unavailable.className = "deck-entry-unavailable";
            const cardId = document.createElement("span");
            cardId.className = "deck-entry-unavailable__id";
            cardId.textContent = `Card ID: ${entry?.cardId ?? "Unknown"}`;
            const status = document.createElement("span");
            status.className = "deck-entry-unavailable__status";
            status.textContent = "Unavailable";
            const removeButton = createDeckEntryRemoveButton(index, `Remove unavailable card ${entry.cardId ?? "unknown"} at position ${index + 1}`);
            unavailable.append(cardId, status, removeButton);
            item.append(unavailable);
        }
        deckEntryList.append(item);
    });
    deckEntryEmpty.hidden = deckDraft.entries.length !== 0;
    deckOpenCardCount.textContent = `${deckDraft.cardIds.length} ${deckDraft.cardIds.length === 1 ? "card entry" : "card entries"}`;
}

function createDeckEntryRemoveButton(index, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button deck-entry-remove-button";
    button.dataset.entryIndex = String(index);
    button.setAttribute("aria-label", label);
    button.textContent = "Remove";
    return button;
}

function handleDeckEntryClick(event) {
    const button = event.target.closest("button[data-entry-index]");
    if (!button || deckDraft === null || !deckEntryList.contains(button)) {
        return;
    }
    const entryIndex = Number(button.dataset.entryIndex);
    if (!Number.isInteger(entryIndex) || entryIndex < 0 || entryIndex >= deckDraft.cardIds.length) {
        return;
    }
    deckDraft.cardIds.splice(entryIndex, 1);
    deckDraft.entries.splice(entryIndex, 1);
    renderDeckEntries();
    updateDeckDraftIndicators();
}

function handleDeckBrowserClick(event) {
    const button = event.target.closest("button[data-card-id]");
    if (!button || !deckBrowserList.contains(button) || openedDeck === null || deckDraft === null) {
        return;
    }
    const card = allCards.find(candidate => String(candidate.id) === button.dataset.cardId);
    if (!card) {
        renderDeckCardBrowser();
        return;
    }
    deckDraft.cardIds.push(card.id);
    deckDraft.entries.push({ cardId: card.id, available: true, card: { ...card } });
    renderDeckEntries();
    updateDeckDraftIndicators();
}

function renderDeckCardBrowser() {
    deckBrowserList.replaceChildren();
    if (openedDeck === null || deckDraft === null) {
        deckBrowserControls.hidden = true;
        setDeckBrowserStatus("Open a deck to browse cards and add entries.");
        deckBrowserList.hidden = true;
        return;
    }

    deckBrowserControls.hidden = false;
    if (collectionLoadState === "loading") {
        setDeckBrowserStatus("Loading available cards...");
        deckBrowserList.hidden = true;
        return;
    }
    if (collectionLoadState === "error") {
        setDeckBrowserStatus("Unable to load available cards. Reload the page to try again.", "error");
        deckBrowserList.hidden = true;
        return;
    }

    const terms = normalizeSearchText(deckBrowserSearch.value).split(/\s+/).filter(Boolean);
    const selectedType = deckBrowserTypeFilter.value;
    const visibleCards = allCards.filter(card => {
        const name = normalizeSearchText(card.name);
        return terms.every(term => name.includes(term))
            && (selectedType === "" || card.type === selectedType);
    });

    if (allCards.length === 0) {
        setDeckBrowserStatus("No cards are available to add.");
        deckBrowserList.hidden = true;
        return;
    }
    if (visibleCards.length === 0) {
        setDeckBrowserStatus("No cards match this search and type filter.");
        deckBrowserList.hidden = true;
        return;
    }

    setDeckBrowserStatus("");
    for (const card of visibleCards) {
        const fragment = deckBrowserCardTemplate.content.cloneNode(true);
        const item = fragment.querySelector(".deck-browser-entry");
        item.querySelector(".collection-card__name").textContent = card.name ?? "Unnamed Card";
        item.querySelector(".collection-card__type").textContent = String(card.type ?? "Unknown type").replaceAll("_", " ");
        item.querySelector(".collection-card__cost").textContent = card.cost === null || card.cost === undefined
            ? "—"
            : String(card.cost);
        const addButton = item.querySelector(".deck-browser-add-button");
        addButton.dataset.cardId = String(card.id);
        addButton.setAttribute("aria-label", `Add ${card.name ?? "card"} to deck`);
        deckBrowserList.append(fragment);
    }
    deckBrowserList.hidden = false;
}

function setDeckBrowserStatus(message, state = "") {
    deckBrowserStatus.textContent = message;
    deckBrowserStatus.className = `deck-browser-status${state ? ` is-${state}` : ""}`;
    deckBrowserStatus.hidden = message === "";
}

function resetDeckBrowserFilters() {
    deckBrowserSearch.value = "";
    deckBrowserTypeFilter.value = "";
}

function refreshDeckDraftAvailability() {
    if (deckDraft === null) {
        return;
    }
    for (const entry of deckDraft.entries) {
        if (!entry.available) {
            continue;
        }
        const currentCard = allCards.find(card => String(card.id) === String(entry.cardId));
        if (currentCard) {
            entry.card = { ...currentCard };
        } else {
            entry.available = false;
            entry.card = null;
        }
    }
    renderDeckEntries();
}

function updateDeckDraftFromForm() {
    if (deckDraft === null) {
        return;
    }
    deckDraft.name = deckDraftNameInput.value;
    deckDraft.description = deckDraftDescriptionInput.value;
    deckMetadataError.hidden = true;
    deckMetadataFeedback.hidden = true;
    updateDeckDraftIndicators();
}

function isDeckDraftDirty() {
    return deckDraft !== null && (
        deckDraft.name !== deckDraft.original.name
        || deckDraft.description !== deckDraft.original.description
        || !deckIdListsEqual(deckDraft.cardIds, deckDraft.original.cardIds)
    );
}

function deckIdListsEqual(first, second) {
    return first.length === second.length && first.every((cardId, index) => String(cardId) === String(second[index]));
}

function updateDeckDraftIndicators() {
    if (deckDraft === null) {
        return;
    }
    const dirty = isDeckDraftDirty();
    deckUnsavedIndicator.hidden = !dirty;
    saveDeckChangesButton.disabled = !dirty || deckMetadataSaving;
    deckOpenName.textContent = deckDraft.name.trim() || "Unnamed Deck";
}

function confirmDiscardDeckDraft() {
    if (!window.confirm("This deck has unsaved changes. Discard them and continue?")) {
        return false;
    }
    if (openedDeck !== null) {
        initializeDeckDraft(openedDeck);
        renderOpenedDeck();
    } else {
        deckDraft = null;
    }
    return true;
}

async function saveDeckMetadata(event) {
    event.preventDefault();
    if (deckDraft === null || openedDeck === null || deckMetadataSaving || !deckMetadataForm.reportValidity()) {
        return;
    }
    const name = deckDraftNameInput.value.trim();
    if (name === "") {
        deckMetadataError.textContent = "Deck name must not be blank.";
        deckMetadataError.hidden = false;
        deckDraftNameInput.focus();
        return;
    }

    deckDraft.name = name;
    deckDraft.description = deckDraftDescriptionInput.value;
    const payload = {
        name,
        description: deckDraft.description.trim() === "" ? null : deckDraft.description,
        cardIds: deckDraft.cardIds.slice()
    };
    const deckId = openedDeck.id;
    deckMetadataSaving = true;
    deckDraftNameInput.disabled = true;
    deckDraftDescriptionInput.disabled = true;
    deckMetadataError.hidden = true;
    deckMetadataFeedback.hidden = true;
    updateDeckDraftIndicators();

    try {
        const response = await fetch(`/api/decks/${encodeURIComponent(deckId)}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (response.status !== 200) {
            const error = await readErrorResponse(response);
            throw new Error(deckErrorMessage(error, "Unable to save deck changes. Please try again."));
        }

        const savedDeck = await response.json();
        if (!savedDeck || String(savedDeck.id) !== String(deckId) || !Array.isArray(savedDeck.cards)) {
            throw new Error("The deck was saved, but its response could not be read. Reopen the deck to verify it.");
        }
        openedDeck = savedDeck;
        initializeDeckDraft(savedDeck);
        renderOpenedDeck();
        const refreshed = await loadDeckSummaries();
        setDeckMetadataFeedback(refreshed ? "Deck changes saved." : "Deck changes saved, but the deck list could not be refreshed.", refreshed ? "success" : "error");
    } catch (error) {
        deckMetadataError.textContent = error instanceof Error ? error.message : "Unable to save deck changes. Please try again.";
        deckMetadataError.hidden = false;
    } finally {
        deckMetadataSaving = false;
        deckDraftNameInput.disabled = false;
        deckDraftDescriptionInput.disabled = false;
        updateDeckDraftIndicators();
    }
}

function setDeckMetadataFeedback(message, state = "") {
    deckMetadataFeedback.textContent = message;
    deckMetadataFeedback.className = `deck-metadata-feedback${state ? ` is-${state}` : ""}`;
    deckMetadataFeedback.hidden = message === "";
}

function setDeckWorkspaceStatus(message, state = "") {
    deckWorkspaceStatus.textContent = message;
    deckWorkspaceStatus.className = `deck-workspace-status${state ? ` is-${state}` : ""}`;
    deckWorkspaceStatus.hidden = false;
}

async function deleteDeck(deckId, deckName) {
    const deletingDraft = openedDeck !== null
        && String(openedDeck.id) === String(deckId)
        && isDeckDraftDirty();
    const confirmation = deletingDraft
        ? `This deck has unsaved changes. Delete "${deckName}" and discard those changes? This action cannot be undone.`
        : `Delete the deck "${deckName}"? This action cannot be undone.`;
    if (!window.confirm(confirmation)) {
        return;
    }

    pendingDeleteDeckId = deckId;
    renderDeckList();
    showDeckFeedback("Deleting deck...");
    try {
        const response = await fetch(`/api/decks/${encodeURIComponent(deckId)}`, { method: "DELETE" });
        if (response.status !== 204) {
            const error = await readErrorResponse(response);
            throw new Error(deckErrorMessage(error, "Unable to delete the deck. Please try again."));
        }

        deckSummaries = deckSummaries.filter(deck => String(deck.id) !== String(deckId));
        if (openedDeck !== null && String(openedDeck.id) === String(deckId)) {
            deckDetailRequestSequence++;
            openedDeck = null;
            deckDraft = null;
            deckWorkspaceDetails.hidden = true;
            setDeckWorkspaceStatus("Choose a saved deck to view its details.");
            renderDeckCardBrowser();
        }
        pendingDeleteDeckId = null;
        renderDeckList();
        const refreshed = await loadDeckSummaries();
        showDeckFeedback(refreshed ? "Deck deleted." : "Deck deleted, but the saved deck list could not be refreshed.", refreshed ? "success" : "error");
    } catch (error) {
        pendingDeleteDeckId = null;
        renderDeckList();
        showDeckFeedback(error instanceof Error ? error.message : "Unable to delete the deck. Please try again.", "error");
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
    renderDeckCardBrowser();

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
        refreshDeckDraftAvailability();
        renderDeckCardBrowser();
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
        renderDeckCardBrowser();
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
