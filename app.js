/* ---------- Хранилище (localStorage) ---------- */

const STORAGE_KEY_TOURS = "svoi-lyudi:tours";
const STORAGE_KEY_BOOKINGS = "svoi-lyudi:bookings";
const STORAGE_KEY_SEEDED = "svoi-lyudi:seeded";

function loadTours() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_TOURS);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Не удалось прочитать экскурсии из хранилища:", e);
    }
    // Первый запуск — кладём тестовые экскурсии в хранилище один раз
    localStorage.setItem(STORAGE_KEY_SEEDED, "1");
    saveTours(SEED_TOURS);
    return [...SEED_TOURS];
}

function saveTours(list) {
    try {
        localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(list));
    } catch (e) {
        console.error("Не удалось сохранить экскурсии в хранилище:", e);
        alert("Не удалось сохранить данные локально. Возможно, хранилище браузера переполнено или отключено.");
    }
}

function loadBookings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Не удалось прочитать брони из хранилища:", e);
    }
    return [];
}

function saveBookings(list) {
    try {
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(list));
    } catch (e) {
        console.error("Не удалось сохранить брони в хранилище:", e);
    }
}

/* ---------- Состояние ---------- */

let tours = loadTours();
let bookings = loadBookings();
const detectedCity = "Томск";

let filters = {
    country: "",
    city: detectedCity,
    dateFrom: "",
    dateTo: "",
    people: "",
    kids: "",
};
let appliedFilters = { ...filters };

let activeTour = null;
let bookingState = {
    slot: null,
    people: 1,
    name: "",
    email: "",
    paymentType: null,
};

/* ---------- Утилиты ---------- */

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function fmtPrice(t) {
    return `${t.price.toLocaleString("ru-RU")} ₽ ${t.priceType === "person" ? "/ чел." : "/ группу"}`;
}

function fmtDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h} ч ${m} мин`;
    if (h) return `${h} ч`;
    return `${m} мин`;
}

function fmtSlot(iso) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return `${date}, ${time}`;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/* ---------- Переключение экранов ---------- */

function showView(name) {
    document.querySelectorAll(".view").forEach((v) => (v.hidden = true));
    document.getElementById(`view-${name}`).hidden = false;
    document.getElementById("createFab").hidden = name === "create";
    document.getElementById("headerLocation").style.visibility = name === "list" ? "visible" : "hidden";
    window.scrollTo(0, 0);
}

/* ---------- Рендер списка ---------- */

function getFilteredTours() {
    return tours.filter((t) => {
        if (appliedFilters.city && t.city !== appliedFilters.city) return false;
        if (appliedFilters.country && !t.country.toLowerCase().includes(appliedFilters.country.toLowerCase()))
            return false;
        if (appliedFilters.kids === "yes" && !t.kidsAllowed) return false;
        if (appliedFilters.people) {
            const p = Number(appliedFilters.people);
            if (t.groupSize && p > t.groupSize) return false;
        }
        if (appliedFilters.dateFrom || appliedFilters.dateTo) {
            if (t.slots && t.slots.length > 0) {
                const inRange = t.slots.some((s) => {
                    const d = s.slice(0, 10);
                    if (appliedFilters.dateFrom && d < appliedFilters.dateFrom) return false;
                    if (appliedFilters.dateTo && d > appliedFilters.dateTo) return false;
                    return true;
                });
                if (!inRange) return false;
            }
        }
        return true;
    });
}

function renderList() {
    const grid = document.getElementById("tourGrid");
    const empty = document.getElementById("emptyState");
    const filtered = getFilteredTours();

    document.getElementById("listTitle").textContent = appliedFilters.city
        ? `Экскурсии: ${appliedFilters.city}`
        : "Все экскурсии";
    document.getElementById("listCount").textContent = `${filtered.length} найдено`;

    grid.innerHTML = "";
    if (filtered.length === 0) {
        empty.hidden = false;
        return;
    }
    empty.hidden = true;

    filtered.forEach((t) => {
        const img = t.photos && t.photos[0] ? t.photos[0] : PLACEHOLDER_IMG;
        const card = document.createElement("div");
        card.className = "tour-card";
        card.innerHTML = `
      <div class="tour-card__image-wrap">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(t.title)}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">
        <div class="tour-card__tags">
          <span class="tag tag--green">${FORMAT_LABELS[t.format]}</span>
        </div>
      </div>
      <div class="tour-card__body">
        <div class="tour-card__meta">${escapeHtml(t.city)} · ${escapeHtml(t.district)}</div>
        <h3 class="tour-card__title">${escapeHtml(t.title)}</h3>
        <p class="tour-card__desc">${escapeHtml(t.shortDesc)}</p>
      </div>
      <div class="ticket-divider"></div>
      <div class="tour-card__footer">
        <div class="tour-card__duration">⏱ ${fmtDuration(t.duration)}</div>
        <div class="tour-card__price">${fmtPrice(t)}</div>
      </div>
    `;
        card.addEventListener("click", () => openTour(t));
        grid.appendChild(card);
    });
}

/* ---------- Детальная страница ---------- */

function openTour(tour) {
    activeTour = tour;
    const img = tour.photos && tour.photos[0] ? tour.photos[0] : PLACEHOLDER_IMG;

    const heroImg = document.getElementById("detailHeroImg");
    heroImg.src = img;
    heroImg.alt = tour.title;
    heroImg.onerror = function () {
        heroImg.onerror = null;
        heroImg.src = PLACEHOLDER_IMG;
    };

    const thumbs = document.getElementById("detailThumbs");
    thumbs.innerHTML = "";
    if (tour.photos && tour.photos.length > 1) {
        tour.photos.slice(1).forEach((p) => {
            const im = document.createElement("img");
            im.src = p;
            im.alt = "";
            im.onerror = function () {
                im.onerror = null;
                im.src = PLACEHOLDER_IMG;
            };
            thumbs.appendChild(im);
        });
    }

    const tags = document.getElementById("detailTags");
    tags.innerHTML = `
    <span class="tag tag--green">${FORMAT_LABELS[tour.format]}</span>
    <span class="tag tag--grey">${tour.kidsAllowed ? "Можно с детьми" : "Без детей"}</span>
    <span class="tag tag--grey">${MOVE_LABELS[tour.move]}</span>
  `;

    document.getElementById("detailTitle").textContent = tour.title;
    document.getElementById("detailLocation").textContent = `${tour.city} · ${tour.district}`;
    document.getElementById("detailDesc").textContent = tour.fullDesc;

    const panel = document.getElementById("detailInfoPanel");
    let items = [
        ["Длительность", fmtDuration(tour.duration)],
        ["Формат", FORMAT_LABELS[tour.format]],
    ];
    if (tour.groupSize) items.push(["Размер группы", `до ${tour.groupSize} чел.`]);
    items.push(["Передвижение", MOVE_LABELS[tour.move]]);
    items.push(["Стоимость", fmtPrice(tour), true]);

    panel.innerHTML = items
        .map(
            ([label, value, accent]) => `
      <div>
        <div class="info-item__label">${label}</div>
        <div class="info-item__value ${accent ? "info-item__value--accent" : ""}">${value}</div>
      </div>
    `
        )
        .join("");

    showView("detail");
}

/* ---------- Бронирование ---------- */

function startBooking() {
    bookingState = { slot: null, people: 1, name: "", email: "", paymentType: null };
    document.getElementById("bookingTourTitle").textContent = activeTour.title;

    const needsSlot = activeTour.slots && activeTour.slots.length > 0;
    const slotList = document.getElementById("slotList");
    const noSlotNote = document.getElementById("noSlotNote");

    slotList.innerHTML = "";
    if (needsSlot) {
        noSlotNote.hidden = true;
        bookingState.slot = activeTour.slots[0];
        activeTour.slots.forEach((s) => {
            const el = document.createElement("label");
            el.className = "slot-option" + (bookingState.slot === s ? " selected" : "");
            el.innerHTML = `<input type="radio" name="slot" ${bookingState.slot === s ? "checked" : ""}> ${fmtSlot(s)}`;
            el.addEventListener("click", () => {
                bookingState.slot = s;
                document.querySelectorAll(".slot-option").forEach((o) => o.classList.remove("selected"));
                el.classList.add("selected");
                el.querySelector("input").checked = true;
            });
            slotList.appendChild(el);
        });
    } else {
        noSlotNote.hidden = false;
    }

    const peopleInput = document.getElementById("peopleInput");
    peopleInput.value = 1;
    const hint = document.getElementById("groupSizeHint");
    if (activeTour.groupSize) {
        peopleInput.max = activeTour.groupSize;
        hint.textContent = `Максимум для этой экскурсии: ${activeTour.groupSize} чел.`;
    } else {
        peopleInput.removeAttribute("max");
        hint.textContent = "";
    }

    document.getElementById("nameInput").value = "";
    document.getElementById("emailInput").value = "";
    document.querySelectorAll(".payment-option").forEach((o) => o.classList.remove("selected"));
    document.getElementById("confirmBtn").disabled = true;

    showStep("slot");
    showView("booking");
}

function showStep(name) {
    ["slot", "contact", "payment", "done"].forEach((s) => {
        document.getElementById(`step-${s}`).hidden = s !== name;
    });
}

function updateTotal() {
    const people = Math.max(1, Number(document.getElementById("peopleInput").value) || 1);
    bookingState.people = people;
    const total = activeTour.priceType === "person" ? activeTour.price * people : activeTour.price;
    document.getElementById("totalPrice").textContent = `${total.toLocaleString("ru-RU")} ₽`;
    return total;
}

function completeBooking() {
    const total = updateTotal();
    const booking = {
        id: uid(),
        tourId: activeTour.id,
        tourTitle: activeTour.title,
        slot: bookingState.slot,
        people: bookingState.people,
        name: bookingState.name,
        email: bookingState.email,
        paymentType: bookingState.paymentType,
        total,
        status: "pending",
        createdAt: new Date().toISOString(),
    };
    bookings.push(booking);
    saveBookings(bookings);

    document.getElementById("doneText").innerHTML = `
    Бронирование создано. Подтверждение отправлено на <strong>${escapeHtml(bookingState.email)}</strong>.
    <br><br>
    Как только создатель экскурсии одобрит заявку, на этот же адрес придут его контакты.
  `;
    showStep("done");
}

/* ---------- Создание экскурсии ---------- */

function toggleGroupSizeField() {
    const format = document.getElementById("c-format").value;
    document.getElementById("groupSizeWrap").style.display = format === "group" ? "block" : "none";
}

function renderPhotoPreview() {
    const raw = document.getElementById("c-photos").value;
    const urls = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    const wrap = document.getElementById("photoPreview");
    wrap.innerHTML = "";

    urls.forEach((url) => {
        const item = document.createElement("div");
        item.className = "photo-preview__item";
        const im = document.createElement("img");
        im.src = url;
        im.alt = "";
        im.onerror = () => item.classList.add("broken");
        im.onload = () => item.classList.remove("broken");
        item.appendChild(im);
        wrap.appendChild(item);
    });
}

function resetCreateForm() {
    document.getElementById("createForm").reset();
    document.getElementById("c-country").value = "Россия";
    document.getElementById("c-duration").value = 90;
    toggleGroupSizeField();
    renderPhotoPreview();
}

function handleCreateSubmit(e) {
    e.preventDefault();

    const title = document.getElementById("c-title").value.trim();
    const city = document.getElementById("c-city").value;
    const country = document.getElementById("c-country").value.trim() || "Россия";
    const district = document.getElementById("c-district").value.trim();
    const shortDesc = document.getElementById("c-shortDesc").value.trim();
    const fullDesc = document.getElementById("c-fullDesc").value.trim();
    const photosRaw = document.getElementById("c-photos").value;
    const format = document.getElementById("c-format").value;
    const move = document.getElementById("c-move").value;
    const groupSize = document.getElementById("c-groupSize").value;
    const duration = document.getElementById("c-duration").value;
    const kids = document.getElementById("c-kids").value;
    const price = document.getElementById("c-price").value;
    const priceType = document.getElementById("c-priceType").value;
    const slotsRaw = document.getElementById("c-slots").value;
    const authorName = document.getElementById("c-authorName").value.trim();
    const authorContact = document.getElementById("c-authorContact").value.trim();

    if (!title || !district || !shortDesc || !fullDesc || !price || !authorName || !authorContact) {
        alert("Заполните все обязательные поля.");
        return;
    }
    if (format === "group" && !groupSize) {
        alert("Укажите размер группы для групповой экскурсии.");
        return;
    }

    const photos = photosRaw.split("\n").map((s) => s.trim()).filter(Boolean);
    const slots = slotsRaw.split("\n").map((s) => s.trim()).filter(Boolean);

    const newTour = {
        id: uid(),
        title,
        city,
        district,
        country,
        photos,
        shortDesc,
        fullDesc,
        format,
        groupSize: format === "group" ? Number(groupSize) : null,
        kidsAllowed: kids === "yes",
        move,
        duration: Number(duration) || 60,
        priceType,
        price: Number(price) || 0,
        author: { name: authorName, contact: authorContact },
        slots,
    };

    tours.unshift(newTour);
    saveTours(tours);
    appliedFilters.city = city;
    filters.city = city;
    document.getElementById("f-city").value = city;

    resetCreateForm();
    renderList();
    showView("list");
}

/* ---------- Инициализация обработчиков ---------- */

document.addEventListener("DOMContentLoaded", () => {
    // фильтры — начальные значения
    document.getElementById("f-city").value = filters.city;

    function applyFiltersFromInputs() {
        filters.country = document.getElementById("f-country").value.trim();
        filters.city = document.getElementById("f-city").value;
        filters.dateFrom = document.getElementById("f-dateFrom").value;
        filters.dateTo = document.getElementById("f-dateTo").value;
        filters.people = document.getElementById("f-people").value;
        filters.kids = document.getElementById("f-kids").value;
        appliedFilters = { ...filters };
        renderList();
    }

    document.getElementById("searchBtn").addEventListener("click", applyFiltersFromInputs);

    // смена города — сразу обновляет список, не дожидаясь кнопки "Поиск"
    document.getElementById("f-city").addEventListener("change", applyFiltersFromInputs);

    document.getElementById("logoBtn").addEventListener("click", () => showView("list"));

    // detail
    document.getElementById("backFromDetail").addEventListener("click", () => showView("list"));
    document.getElementById("bookBtn").addEventListener("click", startBooking);

    // booking
    document.getElementById("backFromBooking").addEventListener("click", () => showView("detail"));
    document.getElementById("peopleInput").addEventListener("input", () => {
        const v = Math.max(1, Number(document.getElementById("peopleInput").value) || 1);
        document.getElementById("peopleInput").value = v;
    });
    document.getElementById("toContactBtn").addEventListener("click", () => {
        const needsSlot = activeTour.slots && activeTour.slots.length > 0;
        if (needsSlot && !bookingState.slot) {
            alert("Выберите время экскурсии.");
            return;
        }

        const people = Math.max(1, Number(document.getElementById("peopleInput").value) || 1);

        if (activeTour.groupSize && people > activeTour.groupSize) {
            alert(`Максимальный размер группы для этой экскурсии — ${activeTour.groupSize} чел. Уменьшите количество человек.`);
            return;
        }

        bookingState.people = people;
        showStep("contact");
    });
    document.getElementById("toPaymentBtn").addEventListener("click", () => {
        const name = document.getElementById("nameInput").value.trim();
        const email = document.getElementById("emailInput").value.trim();
        if (!name || !email) {
            alert("Заполните имя и email.");
            return;
        }
        bookingState.name = name;
        bookingState.email = email;
        updateTotal();
        showStep("payment");
    });
    document.querySelectorAll(".payment-option").forEach((el) => {
        el.addEventListener("click", () => {
            document.querySelectorAll(".payment-option").forEach((o) => o.classList.remove("selected"));
            el.classList.add("selected");
            bookingState.paymentType = el.dataset.type;
            document.getElementById("confirmBtn").disabled = false;
            document.getElementById("confirmBtn").textContent =
                bookingState.paymentType === "online" ? "Оплатить и забронировать" : "Подтвердить бронирование";
        });
    });
    document.getElementById("confirmBtn").addEventListener("click", completeBooking);
    document.getElementById("doneBackBtn").addEventListener("click", () => showView("detail"));

    // create
    document.getElementById("createFab").addEventListener("click", () => {
        resetCreateForm();
        showView("create");
    });
    document.getElementById("backFromCreate").addEventListener("click", () => showView("list"));
    document.getElementById("c-format").addEventListener("change", toggleGroupSizeField);
    document.getElementById("c-photos").addEventListener("input", renderPhotoPreview);
    document.getElementById("createForm").addEventListener("submit", handleCreateSubmit);

    document.getElementById("resetDataBtn").addEventListener("click", () => {
        if (!confirm("Удалить все ваши экскурсии и брони и вернуть тестовые данные?")) return;
        localStorage.removeItem(STORAGE_KEY_TOURS);
        localStorage.removeItem(STORAGE_KEY_BOOKINGS);
        localStorage.removeItem(STORAGE_KEY_SEEDED);
        tours = loadTours();
        bookings = loadBookings();
        appliedFilters = { ...filters };
        renderList();
    });

    toggleGroupSizeField();
    renderList();
    showView("list");
});
