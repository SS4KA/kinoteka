/* ==========================================================
   Кинотека — скрипты
   1. Вспомогательные функции для форм
   2. «Авторизация» (демо на localStorage) и навигация
   3. Форма регистрации (submit + preventDefault) → переход дальше
   4. Форма входа → переход дальше
   5. Поиск и фильтр каталога
   6. Страница фильма
   7. Страница профиля
   ========================================================== */

/* ---------- 1. Вспомогательные функции для форм ---------- */

// Показать текст ошибки под полем и подсветить поле
function showFieldError(input, message) {
  const errorElement = document.getElementById(input.id + "-error");
  errorElement.textContent = message;
  input.classList.add("form-field__input--invalid");
  input.setAttribute("aria-invalid", "true");
}

// Убрать ошибку у поля
function clearFieldError(input) {
  const errorElement = document.getElementById(input.id + "-error");
  errorElement.textContent = "";
  input.classList.remove("form-field__input--invalid");
  input.removeAttribute("aria-invalid");
}

// Вывести общее сообщение под формой (успех или ошибка)
function showFormStatus(statusElement, message, type) {
  statusElement.textContent = message;
  statusElement.className = "form-status form-status--" + type;
}

// Как только пользователь начинает править поле — ошибка у этого поля пропадает
function enableErrorResetOnInput(form) {
  form.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", function () {
      clearFieldError(input);
    });
  });
}

// Регулярное выражение для email: что-то@что-то.домен, без пробелов
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/* ---------- 2. «Авторизация» и навигация ----------
   Backend в ЛР №1 не требуется, поэтому вход имитируется:
   в localStorage хранится логин текущего пользователя (сессия)
   и данные профиля, введённые при регистрации.
   Пароль нигде не сохраняется. */

const USERS_KEY = "cinema_users";     // { логин: {login, fullname, email} }
const SESSION_KEY = "cinema_session"; // логин вошедшего пользователя

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveUser(user) {
  const users = getUsers();
  users[user.login] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

function startSession(login) {
  localStorage.setItem(SESSION_KEY, login);
}

function endSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Данные вошедшего пользователя (если он не регистрировался — только логин)
function getCurrentUser() {
  const login = getSession();
  if (login === null) {
    return null;
  }
  return getUsers()[login] || { login: login };
}

// Адрес страницы, куда нужно вернуться после входа (например, film.html?id=inception).
// Принимаем только адреса нашего сайта вида film.html?id=..., чтобы через параметр
// нельзя было отправить пользователя на чужой сайт.
function getNextUrl() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (next !== null && /^film\.html\?id=[a-z-]+$/.test(next)) {
    return next;
  }
  return null;
}

// После успешного входа/регистрации: выбранный фильм, а если его не было — профиль
function redirectAfterAuth() {
  window.location.href = getNextUrl() || "profile.html";
}

// В шапке: гостю — «Регистрация» и «Вход», вошедшему — «Профиль»
function updateNavigation() {
  const isLoggedIn = getSession() !== null;
  document.querySelectorAll('[data-auth="guest"]').forEach(function (item) {
    item.hidden = isLoggedIn;
  });
  document.querySelectorAll('[data-auth="user"]').forEach(function (item) {
    item.hidden = !isLoggedIn;
  });
}

// На страницах входа и регистрации: показать пояснение и сохранить выбранный фильм
// при переходе между этими двумя страницами
function setupNextHint() {
  const next = getNextUrl();
  if (next === null) {
    return;
  }
  document.querySelectorAll("[data-next-note]").forEach(function (note) {
    note.hidden = false;
  });
  document.querySelectorAll(".auth__switch a").forEach(function (link) {
    link.href = link.getAttribute("href") + "?next=" + encodeURIComponent(next);
  });
}

updateNavigation();
setupNextHint();

/* ---------- 3. Форма регистрации ---------- */
const registerForm = document.getElementById("register-form");

if (registerForm) {
  const fullnameInput = document.getElementById("fullname");
  const emailInput = document.getElementById("email");
  const loginInput = document.getElementById("login");
  const passwordInput = document.getElementById("password");
  const passwordRepeatInput = document.getElementById("password-repeat");
  const registerStatus = document.getElementById("register-status");

  // Возвращает true, если все поля корректны
  function validateRegisterForm() {
    let isValid = true;

    // Сначала очищаем старые ошибки — так форму можно проверять повторно
    [fullnameInput, emailInput, loginInput, passwordInput, passwordRepeatInput].forEach(clearFieldError);

    if (fullnameInput.value.trim() === "") {
      showFieldError(fullnameInput, "Введите ФИО.");
      isValid = false;
    }

    if (emailInput.value.trim() === "") {
      showFieldError(emailInput, "Введите email.");
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailInput.value.trim())) {
      showFieldError(emailInput, "Некорректный email. Пример: name@example.com.");
      isValid = false;
    }

    if (loginInput.value.trim() === "") {
      showFieldError(loginInput, "Введите логин.");
      isValid = false;
    }

    if (passwordInput.value === "") {
      showFieldError(passwordInput, "Введите пароль.");
      isValid = false;
    } else if (passwordInput.value.length < MIN_PASSWORD_LENGTH) {
      showFieldError(passwordInput, "Пароль должен содержать не менее " + MIN_PASSWORD_LENGTH + " символов.");
      isValid = false;
    }

    if (passwordRepeatInput.value === "") {
      showFieldError(passwordRepeatInput, "Повторите пароль.");
      isValid = false;
    } else if (passwordRepeatInput.value !== passwordInput.value) {
      showFieldError(passwordRepeatInput, "Пароли не совпадают.");
      isValid = false;
    }

    return isValid;
  }

  registerForm.addEventListener("submit", function (event) {
    event.preventDefault(); // отменяем стандартную отправку формы

    if (validateRegisterForm()) {
      // Данные профиля сохраняем (без пароля), сразу входим и переходим дальше
      saveUser({
        login: loginInput.value.trim(),
        fullname: fullnameInput.value.trim(),
        email: emailInput.value.trim()
      });
      startSession(loginInput.value.trim());
      redirectAfterAuth();
    } else {
      showFormStatus(registerStatus, "Исправьте ошибки в форме и попробуйте снова.", "error");
    }
  });

  enableErrorResetOnInput(registerForm);
}

/* ---------- 4. Форма входа ---------- */
const loginForm = document.getElementById("login-form");

if (loginForm) {
  const loginNameInput = document.getElementById("login-name");
  const loginPasswordInput = document.getElementById("login-password");
  const loginStatus = document.getElementById("login-status");

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    clearFieldError(loginNameInput);
    clearFieldError(loginPasswordInput);
    let isValid = true;

    if (loginNameInput.value.trim() === "") {
      showFieldError(loginNameInput, "Введите логин.");
      isValid = false;
    }

    if (loginPasswordInput.value === "") {
      showFieldError(loginPasswordInput, "Введите пароль.");
      isValid = false;
    }

    if (isValid) {
      // Демо-режим: настоящая проверка пароля появится вместе с серверной частью
      startSession(loginNameInput.value.trim());
      redirectAfterAuth();
    } else {
      showFormStatus(loginStatus, "Заполните все поля.", "error");
    }
  });

  enableErrorResetOnInput(loginForm);
}

/* ---------- 5. Поиск и фильтр каталога ---------- */
const catalogFilter = document.getElementById("catalog-filter");

if (catalogFilter) {
  const searchInput = document.getElementById("search-input");
  const genreSelect = document.getElementById("genre-select");
  const filmCards = document.querySelectorAll(".film-card");
  const emptyMessage = document.getElementById("catalog-empty");

  function filterCatalog() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedGenre = genreSelect.value;
    let visibleCount = 0;

    filmCards.forEach(function (card) {
      const title = card.querySelector(".film-card__title").textContent.toLowerCase();
      const matchesTitle = title.includes(query);
      const matchesGenre = selectedGenre === "all" || card.dataset.genre === selectedGenre;

      // Карточка показывается, только если подходит и по названию, и по жанру
      card.hidden = !(matchesTitle && matchesGenre);
      if (!card.hidden) {
        visibleCount++;
      }
    });

    emptyMessage.hidden = visibleCount > 0;
  }

  searchInput.addEventListener("input", filterCatalog);
  genreSelect.addEventListener("change", filterCatalog);
  catalogFilter.addEventListener("submit", function (event) {
    event.preventDefault(); // Enter в поиске не должен перезагружать страницу
  });
}

/* ---------- 6. Страница фильма ---------- */

// Данные фильмов: ключ совпадает с именем файла постера и параметром ?id=
const FILMS = {
  "inception": {
    title: "Начало", original: "Inception", year: 2010, genre: "Фантастика",
    duration: "148 мин", rating: "8.7", director: "Кристофер Нолан",
    description: "Специалист по проникновению в чужие сны получает необычное задание: не украсть идею, а незаметно внедрить её в сознание человека. Чем глубже уровни сна, тем сложнее отличить реальность от вымысла."
  },
  "interstellar": {
    title: "Интерстеллар", original: "Interstellar", year: 2014, genre: "Фантастика",
    duration: "169 мин", rating: "8.6", director: "Кристофер Нолан",
    description: "Земля перестаёт быть пригодной для жизни, и группа исследователей отправляется через пространственный тоннель на поиски нового дома для человечества."
  },
  "parasite": {
    title: "Паразиты", original: "Gisaengchung", year: 2019, genre: "Драма",
    duration: "132 мин", rating: "8.5", director: "Пон Джун Хо",
    description: "Небогатая семья постепенно устраивается на работу в дом состоятельных хозяев. Тщательно выстроенный план начинает давать сбои, когда всплывают неожиданные обстоятельства."
  },
  "pulp-fiction": {
    title: "Криминальное чтиво", original: "Pulp Fiction", year: 1994, genre: "Триллер",
    duration: "154 мин", rating: "8.6", director: "Квентин Тарантино",
    description: "Несколько пересекающихся историй из жизни лос-анджелесских бандитов, боксёра и пары грабителей, рассказанных не в хронологическом порядке."
  },
  "shawshank": {
    title: "Побег из Шоушенка", original: "The Shawshank Redemption", year: 1994, genre: "Драма",
    duration: "142 мин", rating: "9.1", director: "Фрэнк Дарабонт",
    description: "Банкир, осуждённый за убийство, которого он не совершал, попадает в тюрьму Шоушенк. Долгие годы он ищет способ сохранить достоинство и надежду на свободу."
  },
  "grand-budapest": {
    title: "Отель «Гранд Будапешт»", original: "The Grand Budapest Hotel", year: 2014, genre: "Комедия",
    duration: "99 мин", rating: "8.0", director: "Уэс Андерсон",
    description: "Легендарный консьерж роскошного отеля и его юный помощник оказываются втянуты в историю о краже бесценной картины и борьбе за наследство."
  },
  "no-country": {
    title: "Старикам тут не место", original: "No Country for Old Men", year: 2007, genre: "Триллер",
    duration: "122 мин", rating: "8.1", director: "Итан и Джоэл Коэн",
    description: "Случайная находка на месте перестрелки в пустыне запускает смертельную погоню, в которую оказываются втянуты охотник, безжалостный преследователь и пожилой шериф."
  },
  "amelie": {
    title: "Амели", original: "Le Fabuleux Destin d'Amélie Poulain", year: 2001, genre: "Комедия",
    duration: "122 мин", rating: "8.3", director: "Жан-Пьер Жюне",
    description: "Застенчивая парижская официантка решает тайно улучшать жизнь окружающих людей и постепенно понимает, что и ей самой пора искать своё счастье."
  }
};

const filmDetails = document.getElementById("film-details");

if (filmDetails) {
  const filmId = new URLSearchParams(window.location.search).get("id");

  if (getSession() === null) {
    // Смотреть фильмы могут только вошедшие пользователи:
    // отправляем на вход и запоминаем, какой фильм был выбран
    window.location.href = "login.html?next=" + encodeURIComponent("film.html?id=" + filmId);
  } else if (Object.prototype.hasOwnProperty.call(FILMS, filmId)) {
    const film = FILMS[filmId];

    document.title = film.title + " — Кинотека";
    document.getElementById("film-poster").src = "posters/" + filmId + ".svg";
    document.getElementById("film-poster").alt = "Постер фильма «" + film.title + "»";
    document.getElementById("film-title").textContent = film.title;
    document.getElementById("film-original").textContent = film.original;
    document.getElementById("film-rating").textContent = film.rating;
    document.getElementById("film-genre").textContent = film.genre;
    document.getElementById("film-year").textContent = film.year;
    document.getElementById("film-duration").textContent = film.duration;
    document.getElementById("film-director").textContent = film.director;
    document.getElementById("film-description").textContent = film.description;

    filmDetails.hidden = false;
  } else {
    document.getElementById("film-not-found").hidden = false;
  }
}

/* ---------- 7. Страница профиля ---------- */
const profileGreeting = document.getElementById("profile-greeting");

if (profileGreeting) {
  const currentUser = getCurrentUser();

  if (currentUser === null) {
    // Профиль доступен только после входа
    window.location.href = "login.html";
  } else {
    const NOT_SPECIFIED = "не указано";

    profileGreeting.textContent = "Добро пожаловать, " + (currentUser.fullname || currentUser.login) + "!";
    document.getElementById("profile-fullname").textContent = currentUser.fullname || NOT_SPECIFIED;
    document.getElementById("profile-email").textContent = currentUser.email || NOT_SPECIFIED;
    document.getElementById("profile-login").textContent = currentUser.login;

    document.getElementById("logout-button").addEventListener("click", function () {
      endSession();
      window.location.href = "index.html";
    });
  }
}
