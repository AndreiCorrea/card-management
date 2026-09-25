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
