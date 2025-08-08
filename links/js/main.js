// main.js - Полный, не сокращенный, исправленный оригинальный файл.

// Импорт конфигурационных файлов
import { appConfig, profileConfig, linksConfig } from '../config.js';
import { strings } from '../strings.js';

/**
 * Импорт библиотеки Skinview3D.
 * Обновлено до версии 3.4.1.
 * Используется синтаксис `import * as` для импорта всех экспортов модуля.
 * Это делает классы и функции Skinview3D доступными через объект `skinview3d` (например, `skinview3d.SkinViewer`).
 */
import * as skinview3d from "https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/+esm";

/**
 * @constant {object} DOM - Объект, содержащий ссылки на все используемые DOM-элементы.
 * Это централизованное хранилище для быстрого доступа к элементам, уменьшающее количество вызовов `document.getElementById` и улучшающее производительность.
 */
const DOM = {
    appContainer: document.getElementById('app'),
    mainView: document.getElementById('main-view'),
    devView: document.getElementById('dev-view'),
    offlineWarning: document.getElementById('offline-warning'),
    offlineMessage: document.getElementById('offline-message'),
    liveStreamSection: document.getElementById('live-stream-section'),
    liveEmbed: document.getElementById('live-embed'),
    twitchNotification: document.getElementById('twitch-notification'),
    twitchMessage: document.getElementById('twitch-message'),
    twitchLink: document.getElementById('twitch-link'),
    twitchLinkText: document.getElementById('twitch-link-text'),
    profileSection: document.getElementById('profile-section'),
    avatar: document.getElementById('avatar'),
    profileName: document.getElementById('profile-name'),
    profileDescription: document.getElementById('profile-description'),
    totalFollowers: document.getElementById('total-followers'),
    linksSection: document.getElementById('links-section'),
    supportSection: document.getElementById('support-section'),
    supportButton: document.getElementById('support-button'),
    supportButtonText: document.getElementById('support-button-text'),
    minecraftBlock: document.getElementById('minecraft-block'),
    minecraftTitle: document.getElementById('minecraft-title'),
    skinViewerContainer: document.getElementById('skin-viewer-container'),
    skinCanvas: document.getElementById('skin-canvas'),
    downloadSkinButton: document.getElementById('download-skin-button'),
    downloadSkinText: document.getElementById('download-skin-text'),
    youtubeVideosSection: document.getElementById('youtube-videos-section'),
    recentVideosTitle: document.getElementById('recent-videos-title'),
    videoCarousel: document.getElementById('video-carousel'),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    languageToggle: document.getElementById('language-toggle'),
    devToggle: document.getElementById('dev-toggle'),
    backToMainButton: document.getElementById('back-to-main-button'),
    devTitle: document.getElementById('dev-title'),
    devLastUpdatedLabel: document.getElementById('dev-last-updated-label'),
    devLastUpdated: document.getElementById('dev-last-updated'), // Добавлен элемент для даты обновления
    devDataJsonContentLabel: document.getElementById('dev-data-json-content-label'),
    devDataJsonContent: document.getElementById('dev-data-json-content'),
    devDebugInfoContentLabel: document.getElementById('dev-debug-info-content-label'),
    devDebugInfoContent: document.getElementById('dev-debug-info-content'),
    backToMainText: document.getElementById('back-to-main-text'),
    firstVisitModal: document.getElementById('first-visit-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalDescription: document.getElementById('modal-description'),
    modalCloseBtn: document.getElementById('modal-close'),
    linkPreviewModal: document.getElementById('link-preview-modal'),
    previewAvatar: document.getElementById('preview-avatar'),
    previewName: document.getElementById('preview-name'),
    previewDescription: document.getElementById('preview-description'),
    previewOpenLink: document.getElementById('preview-open-link'),
    previewCloseButton: document.getElementById('preview-close-button'),
    mediaBlockDesktop: document.querySelector('.media-block-desktop')
};

// --- Состояние приложения ---
let currentTheme = localStorage.getItem('theme') || 'dark'; // Текущая тема: 'dark' (темная) по умолчанию
let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ru') ? 'ru' : 'en'); // Текущий язык: 'ru' (русский), если язык браузера русский, иначе 'en' (английский)
let appData = {}; // Данные приложения (будут загружены из data.json)
let isDevViewActive = false; // Флаг, указывающий, активен ли вид разработчика

// --- Переменные для SkinViewer3D ---
let skinViewerInstance = null; // Экземпляр просмотрщика скина SkinViewer3D

// --- Вспомогательные функции ---

/**
 * @function setVisibility
 * @param {HTMLElement} element - DOM-элемент, видимость которого нужно изменить.
 * @param {boolean} isVisible - Если `true`, элемент становится видимым (класс `hidden` удаляется). Если `false`, элемент скрывается (класс `hidden` добавляется).
 * Проверяет существование элемента перед изменением его классов, чтобы избежать ошибок.
 */
const setVisibility = (element, isVisible) => {
    if (element) {
        if (isVisible) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
};

/**
 * @function renderView
 * @param {string} view - Определяет, какой вид должен быть отображен: 'main' для основного пользовательского интерфейса или 'dev' для страницы разработчика.
 * Управляет классами `hidden` для контейнеров `main-view` и `dev-view`.
 * Если активируется вид разработчика, вызывает `renderDevPage` для обновления содержимого.
 */
const renderView = (view) => {
    isDevViewActive = (view === 'dev');
    setVisibility(DOM.mainView, view === 'main');
    setVisibility(DOM.devView, view === 'dev');
    if (view === 'dev') {
        renderDevPage(); // Рендерим страницу разработчика, если она активирована
    }
    console.log(`[View] Переключен вид на: ${view}`);
};

/**
 * @function applyTheme
 * @param {string} theme - Название темы для применения ('dark' или 'light').
 * Удаляет все классы темы с `<body>` и добавляет соответствующий класс (`dark-theme` или `light-theme`).
 * Сохраняет выбранную тему в `localStorage`.
 * Обновляет иконку и `aria-label` для кнопки переключения темы.
 */
const applyTheme = (theme) => {
    document.body.classList.remove('dark-theme', 'light-theme'); // Удаляем обе темы
    document.body.classList.add(`${theme}-theme`); // Применяем выбранную тему
    localStorage.setItem('theme', theme); // Сохраняем выбор темы в локальном хранилище
    if (DOM.themeIcon) DOM.themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode'; // Обновляем иконку
    if (DOM.themeToggle) DOM.themeToggle.setAttribute('aria-label', strings[currentLang][`theme${theme === 'dark' ? 'Light' : 'Dark'}`]); // Обновляем aria-label для доступности
    console.log(`[Theme] Применена тема: ${theme}`);
};

/**
 * @function updateLanguage
 * Обновляет весь динамический текстовый контент в пользовательском интерфейсе
 * на основе текущего выбранного языка (`currentLang`).
 * Проходит по всем элементам DOM, которым требуется локализация, и устанавливает их `textContent` или `alt` атрибуты.
 * После обновления языка, перерендерит компоненты, использующие текстовые строки, такие как секция ссылок,
 * пересчитывает подписчиков и обновляет расположение стрима.
 */
const updateLanguage = () => {
    console.log(`[Language] Обновление UI для языка: ${currentLang}`);
    // Обновление текста для различных элементов DOM
    if (DOM.recentVideosTitle) DOM.recentVideosTitle.textContent = strings[currentLang].recentVideosTitle;
    if (DOM.minecraftTitle) DOM.minecraftTitle.textContent = strings[currentLang].minecraftTitle;
    if (DOM.downloadSkinText) DOM.downloadSkinText.textContent = strings[currentLang].downloadSkin;
    if (DOM.supportButtonText) DOM.supportButtonText.textContent = strings[currentLang].supportButton;
    if (DOM.offlineMessage) DOM.offlineMessage.textContent = strings[currentLang].offlineMessage;
    if (DOM.twitchLinkText) DOM.twitchLinkText.textContent = strings[currentLang].watchOnTwitch;
    if (DOM.previewOpenLink) DOM.previewOpenLink.textContent = strings[currentLang].openLinkButton;
    if (DOM.previewCloseButton) DOM.previewCloseButton.textContent = strings[currentLang].closeButton;
    if (DOM.modalTitle) DOM.modalTitle.textContent = strings[currentLang].modalTitle;
    if (DOM.modalDescription) DOM.modalDescription.textContent = strings[currentLang].modalDescription;
    if (DOM.modalCloseBtn) DOM.modalCloseBtn.textContent = strings[currentLang].gotItButton;
    if (DOM.devTitle) DOM.devTitle.textContent = strings[currentLang].devPageTitle;
    if (DOM.devLastUpdatedLabel) DOM.devLastUpdatedLabel.textContent = strings[currentLang].devLastUpdatedLabel;
    if (DOM.devDataJsonContentLabel) DOM.devDataJsonContentLabel.textContent = strings[currentLang].devDataJsonContentLabel;
    if (DOM.devDebugInfoContentLabel) DOM.devDebugInfoContentLabel.textContent = strings[currentLang].devDebugInfoContentLabel;
    if (DOM.devDebugInfoContent) DOM.devDebugInfoContent.textContent = strings[currentLang].devDebugInfoContent;
    if (DOM.backToMainText) DOM.backToMainText.textContent = strings[currentLang].backToMainText;
    // Локализация профиля и alt-текстов для изображений
    if (DOM.profileName) DOM.profileName.textContent = strings[currentLang][profileConfig.name_key];
    if (DOM.profileDescription) DOM.profileDescription.textContent = strings[currentLang][profileConfig.description_key];
    if (DOM.avatar) DOM.avatar.alt = strings[currentLang].avatarAlt;
    if (DOM.previewAvatar) DOM.previewAvatar.alt = strings[currentLang].previewAvatarAlt;
    if (DOM.twitchMessage) DOM.twitchMessage.textContent = strings[currentLang].twitchStreamAlsoLive;

    // Перерендеринг элементов, которые динамически создаются и используют локализованные строки
    renderLinksSection(linksConfig);
    calculateAndDisplayTotalFollowers(); // Пересчитываем и отображаем подписчиков (текст "Всего подписчиков")
    applyTheme(currentTheme); // Повторно применяем тему для обновления атрибута aria-label
    handleLayout(); // Обновляем расположение стрима при смене языка/макета
};

/**
 * @function formatCount
 * @param {number} num - Число для форматирования (например, количество подписчиков).
 * @returns {string} Отформатированная строка числа (например, "123.4K", "1.2M", "500").
 * Если число равно `null` или `NaN`, возвращает локализованную строку "Загрузка...".
 */
const formatCount = (num) => {
    if (num === null || num === undefined || isNaN(num)) return strings[currentLang].loading;
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

/**
 * @function calculateAndDisplayTotalFollowers
 * Вычисляет и отображает общее количество подписчиков, суммируя данные из `appData.followerCounts`.
 * Если данные из `appData` недоступны, пытается использовать кэшированные значения из `localStorage`.
 * Отображает локализованный текст "Всего подписчиков: [количество]".
 */
const calculateAndDisplayTotalFollowers = () => {
    let total = 0;
    let allCountsAvailable = true;
    const sourceCounts = appData.followerCounts || {};
    // Проходим по всем ссылкам в конфигурации, чтобы суммировать подписчиков
    for (const link of linksConfig) {
        // Учитываем только социальные ссылки, которые активны и должны показывать счетчик
        if (link.isSocial && link.showSubscriberCount && link.active) {
            const count = sourceCounts[link.platformId];
            if (typeof count === 'number') {
                total += count;
                // Сохраняем в localStorage для оффлайн-доступа
                localStorage.setItem(`follower_count_${link.platformId}`, count.toString());
            } else {
                // Если данные API недоступны, пытаемся использовать кэшированные из localStorage
                const cachedCount = localStorage.getItem(`follower_count_${link.platformId}`);
                if (cachedCount && !isNaN(parseInt(cachedCount))) {
                    total += parseInt(cachedCount);
                } else {
                    allCountsAvailable = false; // Если нет ни API данных, ни кэша, флаг false
                }
            }
        }
    }
    // Отображаем общее количество подписчиков, если секция профиля видима
    if (DOM.profileSection && appConfig.showProfileSection) {
        if (DOM.totalFollowers) {
            DOM.totalFollowers.textContent = `${strings[currentLang].totalFollowers}${allCountsAvailable ? formatCount(total) : strings[currentLang].loading}`;
        }
    }
};

/**
 * @function fetchAppData
 * @async
 * Получает данные приложения из `data.json`.
 * В случае неудачи использует имитированные (fallback) данные.
 * @returns {Promise<object>} Promise, который разрешается в объект с данными приложения.
 */
const fetchAppData = async () => {
    console.log("[Data Fetch] Попытка загрузки данных приложения из data.json...");
    try {
        // ИСПРАВЛЕНИЕ: Правильный путь к файлу data.json из папки /links/js/
        const response = await fetch('../../data.json?t=' + Date.now());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("[Data Fetch] Данные приложения успешно загружены:", data);
        return data;
    } catch (error) {
        console.error("[Data Fetch] Ошибка загрузки data.json. Использование fallback данных.", error);
        // Fallback данные, если data.json недоступен или произошла ошибка
        return {
            "followerCounts": {}, // Пустой объект, чтобы не было ошибок
            "youtubeVideos": [],
            "liveStream": { "type": "none" },
            "lastUpdated": new Date().toISOString(),
            "debugInfo": { "message": "Data loaded from client-side fallback due to data.json fetch error.", "status": "ERROR - Data.json failed to load", "error": error.message, "version": "client-fallback" }
        };
    }
};

/**
 * @function renderProfileSection
 * Рендерит секцию профиля пользователя (аватар, имя, описание) на основе `profileConfig`.
 * Видимость секции контролируется `appConfig.showProfileSection`.
 */
const renderProfileSection = () => {
    setVisibility(DOM.profileSection, appConfig.showProfileSection);
    if (appConfig.showProfileSection) {
        if (DOM.avatar) DOM.avatar.src = profileConfig.avatar;
        // Используем локализованные ключи для имени и описания
        if (DOM.profileName) DOM.profileName.textContent = strings[currentLang][profileConfig.name_key];
        if (DOM.profileDescription) DOM.profileDescription.textContent = strings[currentLang][profileConfig.description_key];
        if (DOM.avatar) DOM.avatar.alt = strings[currentLang].avatarAlt;
        console.log("[Render] Секция профиля отрисована.");
    }
};

/**
 * @function renderLinksSection
 * @param {Array<object>} links - Массив объектов ссылок из `linksConfig` для рендеринга.
 * Очищает существующие ссылки и динамически создает новые карточки для каждой активной ссылки.
 * Поддерживает использование иконок Material Symbols или пользовательских локальных иконок (`customIconUrl`).
 * Добавляет слушатели событий для предпросмотра ссылки и жестов свайпа.
 */
const renderLinksSection = (links) => {
    setVisibility(DOM.linksSection, appConfig.showLinksSection);
    if (appConfig.showLinksSection) {
        DOM.linksSection.innerHTML = ''; // Полностью очищаем секцию перед рендерингом
        // Фильтруем только активные ссылки и сортируем по порядку
        const sortedLinks = links.filter(link => link.active).sort((a, b) => a.order - b.order);
        sortedLinks.forEach(link => {
            const card = document.createElement('a');
            card.href = link.url;
            card.target = "_blank"; // Открывать в новой вкладке
            card.rel = "noopener noreferrer"; // Для безопасности при открытии новых вкладок
            card.className = `card relative flex items-center justify-between p-4 rounded-2xl m3-shadow-md ${link.isSocial ? 'swipe-target' : ''} cursor-pointer`;
            card.setAttribute('data-link-id', link.label_key); // Используется для идентификации ссылки
            card.setAttribute('data-platform-id', link.platformId || ''); // ID платформы для данных API
            // Добавляем слушатели событий для предпросмотра ссылки и свайпов
            let previewTimeout;
            card.addEventListener('pointerenter', () => { // При наведении курсора
                clearTimeout(previewTimeout);
                // Показываем предпросмотр только если он не для этой же ссылки уже открыт
                if (!DOM.linkPreviewModal.classList.contains('active') || DOM.linkPreviewModal.dataset.currentLinkKey !== link.label_key) {
                    previewTimeout = setTimeout(() => showLinkPreview(link), 100);
                }
            });
            card.addEventListener('pointerleave', () => { // При уходе курсора
                clearTimeout(previewTimeout);
                hideLinkPreview(); // Скрываем предпросмотр с небольшой задержкой
            });
            // Для мобильных устройств: первый тап - показать предпросмотр, второй тап (на кнопке в предпросмотре) - открыть ссылку
            card.addEventListener('click', (e) => {
                // Если предпросмотр уже показан для этой ссылки, то позволяем дефолтному действию (открытие ссылки) произойти
                if (DOM.linkPreviewModal.classList.contains('active') && DOM.linkPreviewModal.dataset.currentLinkKey === link.label_key) {
                    // Разрешить дефолтный клик, чтобы ссылка открылась
                } else {
                    e.preventDefault(); // Предотвращаем дефолтное действие, чтобы сначала показать превью
                    showLinkPreview(link);
                }
            });
            // Формируем HTML для иконки: приоритет customIconUrl > Material Symbols
            let iconHtml = '';
            if (link.customIconUrl) {
                iconHtml = `<img src="${link.customIconUrl}" alt="${strings[currentLang][link.label_key] || link.label_key} icon" class="custom-icon-image">`;
            } else if (link.icon) {
                iconHtml = `<span class="material-symbols-outlined icon-large">${link.icon}</span>`;
            } else {
                iconHtml = `<span class="material-symbols-outlined icon-large">link</span>`;
            }
            // Формируем HTML для счетчика подписчиков
            let followerCountHtml = '';
            if (link.isSocial && link.showSubscriberCount) {
                // ИСПРАВЛЕНИЕ: Добавлена проверка на существование appData.followerCounts
                const count = appData.followerCounts ? appData.followerCounts[link.platformId] : undefined;
                followerCountHtml = `<span class="text-sm text-gray-400 mr-2 follower-count-display">${formatCount(count)}</span>`;
            }
            // Вставляем сгенерированный HTML в карточку
            card.innerHTML = `
                <div class="flex items-center">
                    ${iconHtml}
                    <div>
                        <span class="block text-lg font-medium">${strings[currentLang][link.label_key] || link.label_key}</span>
                    </div>
                </div>
                ${followerCountHtml}
            `;
            DOM.linksSection.appendChild(card);
        });
        console.log("[Render] Секция ссылок отрисована.");
        initSwipeGestures(); // Инициализируем жесты свайпа для новых карточек
    }
};

/**
 * @function renderYouTubeVideosSection
 * Рендерит секцию последних видео YouTube, создавая карточки для каждого видео.
 * Видимость секции контролируется `appConfig.showYouTubeVideosSection` и наличием видео.
 */
const renderYouTubeVideosSection = () => {
    const videos = appData.youtubeVideos || [];
    setVisibility(DOM.youtubeVideosSection, appConfig.showYouTubeVideosSection && videos.length > 0);
    if (appConfig.showYouTubeVideosSection && videos.length > 0) {
        if (DOM.videoCarousel) DOM.videoCarousel.innerHTML = ''; // Очищаем карусель
        videos.forEach(video => {
            const videoCard = document.createElement('a');
            videoCard.href = `https://www.youtube.com/watch?v=${video.id}`;
            videoCard.target = "_blank";
            videoCard.rel = "noopener noreferrer";
            videoCard.className = "flex-shrink-0 w-64 rounded-2xl overflow-hidden m3-shadow-md card";
            videoCard.innerHTML = `
                <img src="${video.thumbnailUrl}" alt="${video.title}" class="w-full h-36 object-cover">
                <div class="p-3">
                    <p class="text-sm font-medium leading-tight">${video.title}</p>
                </div>
            `;
            if (DOM.videoCarousel) DOM.videoCarousel.appendChild(videoCard);
        });
        console.log("[Render] Секция видео YouTube отрисована.");
    }
};

/**
 * @function handleLayout
 * Управляет расположением секции прямой трансляции и скина в зависимости от ширины экрана.
 */
const handleLayout = () => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const streamInfo = appData.liveStream;
    const shouldShowStream = appConfig.showLiveStreamSection && streamInfo && streamInfo.type !== 'none';
    const shouldShowSkin = appConfig.showMinecraftSkinSection;

    // Сначала управляем видимостью блоков
    setVisibility(DOM.liveStreamSection, shouldShowStream);
    setVisibility(DOM.minecraftBlock, shouldShowSkin);

    if (isDesktop) {
        // На десктопе, перемещаем стрим и скин в правый блок
        if (shouldShowStream && !DOM.mediaBlockDesktop.contains(DOM.liveStreamSection)) {
            DOM.mediaBlockDesktop.prepend(DOM.liveStreamSection);
        }
        if (shouldShowSkin && !DOM.mediaBlockDesktop.contains(DOM.minecraftBlock)) {
            DOM.mediaBlockDesktop.appendChild(DOM.minecraftBlock);
        }
    } else {
        // На мобильных, возвращаем их в основной поток
        if (shouldShowStream && !DOM.mainView.contains(DOM.liveStreamSection)) {
            DOM.profileSection.after(DOM.liveStreamSection);
        }
        if (shouldShowSkin && !DOM.mainLinksBlock.parentNode.contains(DOM.minecraftBlock)) {
            DOM.mainLinksBlock.parentNode.after(DOM.minecraftBlock);
        }
    }

    if (shouldShowStream) {
        displayLiveStreamContent(streamInfo);
    }
};


/**
 * @function displayLiveStreamContent
 * @param {object} streamInfo - Объект с информацией о текущей прямой трансляции из `appData.liveStream`.
 * Встраивает соответствующий плеер (YouTube или Twitch) в iframe.
 * Отображает или скрывает уведомление о сопутствующем стриме на Twitch.
 */
const displayLiveStreamContent = (streamInfo) => {
    if (DOM.liveEmbed) DOM.liveEmbed.src = ''; // Очищаем src на случай, если стрим закончился
    setVisibility(DOM.twitchNotification, false); // Скрываем уведомление Twitch по умолчанию
    if (streamInfo.type === 'youtube' && streamInfo.id) {
        // Если активен YouTube стрим, встраиваем его
        if (DOM.liveEmbed) DOM.liveEmbed.src = `https://www.youtube.com/embed/${streamInfo.id}?autoplay=1&mute=0&controls=1`;
        // Если есть сопутствующий стрим на Twitch, показываем уведомление
        if (streamInfo.twitchLive && streamInfo.twitchLive.twitchChannelName) {
            if (DOM.twitchMessage) DOM.twitchMessage.textContent = strings[currentLang].twitchStreamAlsoLive; // Используем локализованную строку
            if (DOM.twitchLink) DOM.twitchLink.href = `https://www.twitch.tv/${streamInfo.twitchLive.twitchChannelName}`;
            setVisibility(DOM.twitchNotification, true);
        }
    } else if (streamInfo.type === 'twitch' && streamInfo.twitchChannelName) {
        // Если активен Twitch стрим, встраиваем его
        if (DOM.liveEmbed) DOM.liveEmbed.src = `https://player.twitch.tv/?channel=${streamInfo.twitchChannelName}&parent=${window.location.hostname}&autoplay=true&mute=false`;
    }
};

/**
 * @function manageFirstVisitModal
 * Управляет отображением модального окна с инструкциями для первого посещения.
 * Модальное окно показывается только один раз, затем его состояние сохраняется в `localStorage`.
 */
const manageFirstVisitModal = () => {
    if (!DOM.firstVisitModal) return;
    const hasVisited = localStorage.getItem('visited_modal');
    if (!hasVisited) {
        setVisibility(DOM.firstVisitModal, true);
        DOM.firstVisitModal.style.display = 'flex'; // Используем flex для центрирования
        DOM.modalCloseBtn.onclick = () => {
            setVisibility(DOM.firstVisitModal, false);
            DOM.firstVisitModal.style.display = 'none';
            localStorage.setItem('visited_modal', 'true');
        };
    } else {
        setVisibility(DOM.firstVisitModal, false);
        DOM.firstVisitModal.style.display = 'none';
    }
};

/**
 * @function initSwipeGestures
 * Инициализирует жесты свайпа (как для мыши, так и для касания) для карточек ссылок с классом `swipe-target`.
 */
const initSwipeGestures = () => {
    const swipeTargets = document.querySelectorAll('.swipe-target');
    console.log(`[Gestures] Инициализация жестов свайпа для ${swipeTargets.length} элементов.`);
    swipeTargets.forEach(card => {
        let startX = 0, startY = 0, currentX = 0, currentY = 0;
        let isSwiping = false, swipeStarted = false;

        const linkData = linksConfig.find(link => link.label_key === card.getAttribute('data-link-id'));
        if (!linkData) return;

        const handleStart = (e) => {
            isSwiping = true;
            swipeStarted = false;
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            card.style.transition = 'none';
        };

        const handleMove = (e) => {
            if (!isSwiping) return;
            currentX = e.touches ? e.touches[0].clientX : e.clientX;
            currentY = e.touches ? e.touches[0].clientY : e.clientY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            if (!swipeStarted) {
                if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
                    isSwiping = false;
                    return;
                }
                if (Math.abs(deltaX) > 30) {
                    swipeStarted = true;
                    e.preventDefault();
                }
            }

            if (swipeStarted) {
                e.preventDefault();
                card.style.transform = `translateX(${deltaX}px)`;
                card.classList.toggle('swiping-right', deltaX > 0);
                card.classList.toggle('swiping-left', deltaX < 0);
            }
        };

        const handleEnd = () => {
            if (!isSwiping) return;
            isSwiping = false;
            card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease';
            card.classList.remove('swiping-left', 'swiping-right');
            const deltaX = currentX - startX;
            const swipeThreshold = card.offsetWidth * 0.25;

            if (swipeStarted && Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0) {
                    window.open(linkData.subscribeUrl || linkData.url, '_blank');
                } else {
                     if (linkData.platformId === 'youtube') {
                        const liveStream = appData.liveStream;
                        if (liveStream && liveStream.type === 'youtube' && liveStream.id) {
                            window.open(`https://www.youtube.com/watch?v=${liveStream.id}`, '_blank');
                        } else if (appData.youtubeVideos && appData.youtubeVideos.length > 0) {
                            window.open(`https://www.youtube.com/watch?v=${appData.youtubeVideos[0].id}`, '_blank');
                        } else {
                            window.open(linkData.url, '_blank');
                        }
                    } else {
                        window.open(linkData.url, '_blank');
                    }
                }
            }
            card.style.transform = 'translateX(0)';
            swipeStarted = false;
        };

        const handleClickForPreview = (e) => {
            if (swipeStarted) {
                e.preventDefault();
                return;
            }
            if (DOM.linkPreviewModal.classList.contains('active') && DOM.linkPreviewModal.dataset.currentLinkKey === linkData.label_key) {
                // allow click
            } else {
                e.preventDefault();
                showLinkPreview(linkData);
            }
        };

        card.addEventListener('mousedown', handleStart);
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseup', handleEnd);
        card.addEventListener('mouseleave', handleEnd);
        card.addEventListener('touchstart', handleStart, { passive: false });
        card.addEventListener('touchmove', handleMove, { passive: false });
        card.addEventListener('touchend', handleEnd);
        card.addEventListener('click', handleClickForPreview);
    });
};

/**
 * @function initMinecraftSkinViewer
 * Инициализирует 3D-просмотрщик скина Minecraft.
 */
const initMinecraftSkinViewer = () => {
    if (!appConfig.showMinecraftSkinSection) {
        setVisibility(DOM.minecraftBlock, false);
        return;
    }
    if (!DOM.skinCanvas || !DOM.skinViewerContainer) return;
    if (skinViewerInstance) skinViewerInstance.dispose();
    try {
        skinViewerInstance = new skinview3d.SkinViewer({
            canvas: DOM.skinCanvas,
            width: DOM.skinViewerContainer.clientWidth,
            height: DOM.skinViewerContainer.clientHeight,
        });
        skinViewerInstance.loadSkin(profileConfig.minecraftSkinUrl)
            .then(() => {
                skinViewerInstance.animation = new skinview3d.WalkingAnimation();
                skinview3d.createOrbitControls(skinViewerInstance);
            })
            .catch(e => console.error("Ошибка загрузки скина:", e));
        
        new ResizeObserver(() => {
            if (skinViewerInstance) {
                skinViewerInstance.setSize(DOM.skinViewerContainer.clientWidth, DOM.skinViewerContainer.clientHeight);
            }
        }).observe(DOM.skinViewerContainer);
        setVisibility(DOM.minecraftBlock, true);
        if (DOM.downloadSkinButton) DOM.downloadSkinButton.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = profileConfig.minecraftSkinUrl;
            a.download = 'minecraft_skin.png';
            a.click();
        });
    } catch (error) {
        console.error("Ошибка инициализации 3D-просмотрщика скина:", error);
        setVisibility(DOM.minecraftBlock, false);
    }
};

const setupSupportButton = () => {
    setVisibility(DOM.supportSection, appConfig.showSupportButton);
    if (appConfig.showSupportButton && DOM.supportButton) {
        DOM.supportButton.href = appConfig.supportUrl || "#";
    }
};

const renderDevPage = () => {
    if (DOM.devLastUpdated) DOM.devLastUpdated.textContent = appData.lastUpdated ? new Date(appData.lastUpdated).toLocaleString(currentLang) : 'N/A';
    if (DOM.devDataJsonContent) DOM.devDataJsonContent.textContent = JSON.stringify(appData, null, 2);
    if (DOM.devDebugInfoContent) DOM.devDebugInfoContent.textContent = JSON.stringify(appData.debugInfo || {}, null, 2);
};

const setupAnalytics = () => {
    console.log("[Analytics] Настройка заглушки Google Analytics...");
};

const showLinkPreview = (linkData) => {
    if (!DOM.linkPreviewModal) return;
    clearTimeout(DOM.linkPreviewModal._hideTimeout);
    if (DOM.linkPreviewModal.classList.contains('active') && DOM.linkPreviewModal.dataset.currentLinkKey === linkData.label_key) return;
    
    if (DOM.previewAvatar) DOM.previewAvatar.src = profileConfig.avatar;
    if (DOM.previewName) DOM.previewName.textContent = strings[currentLang][profileConfig.name_key];
    if (DOM.previewDescription) DOM.previewDescription.textContent = strings[currentLang][profileConfig.description_key];
    if (DOM.previewOpenLink) DOM.previewOpenLink.textContent = strings[currentLang].openLinkButton;
    if (DOM.previewOpenLink) DOM.previewOpenLink.href = linkData.url;
    if (DOM.previewCloseButton) DOM.previewCloseButton.textContent = strings[currentLang].closeButton;

    DOM.linkPreviewModal.dataset.currentLinkKey = linkData.label_key;
    setVisibility(DOM.linkPreviewModal, true);
    DOM.linkPreviewModal.classList.add('active');
    DOM.linkPreviewModal.style.display = 'flex';
    if (DOM.previewCloseButton) DOM.previewCloseButton.onclick = hideLinkPreview;
    if (DOM.previewAvatar) DOM.previewAvatar.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewName) DOM.previewName.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewDescription) DOM.previewDescription.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
};

const hideLinkPreview = () => {
    DOM.linkPreviewModal._hideTimeout = setTimeout(() => {
        setVisibility(DOM.linkPreviewModal, false);
        DOM.linkPreviewModal.classList.remove('active');
        DOM.linkPreviewModal.style.display = 'none';
        DOM.linkPreviewModal.dataset.currentLinkKey = '';
    }, 100);
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("------------------------------------------");
    console.log("DOMContentLoaded: Запуск инициализации приложения Personal Link Aggregator.");

    applyTheme(currentTheme);
    updateLanguage();

    DOM.themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    });

    DOM.languageToggle.addEventListener('click', () => {
        currentLang = currentLang === 'ru' ? 'en' : 'ru';
        localStorage.setItem('lang', currentLang);
        updateLanguage();
    });

    setVisibility(DOM.devToggle, appConfig.developmentMode && appConfig.showDevToggle);
    if (appConfig.developmentMode && appConfig.showDevToggle && DOM.devToggle) {
        DOM.devToggle.addEventListener('click', () => renderView(isDevViewActive ? 'main' : 'dev'));
        if (DOM.backToMainButton) DOM.backToMainButton.addEventListener('click', () => renderView('main'));
    }

    if (window.location.hash === '#/dev' && appConfig.developmentMode) {
        renderView('dev');
    }

    appData = await fetchAppData();

    renderProfileSection();
    renderLinksSection(linksConfig);
    renderYouTubeVideosSection();
    setupSupportButton();
    initMinecraftSkinViewer();
    manageFirstVisitModal();
    setupAnalytics();
    
    handleLayout();
    window.addEventListener('resize', handleLayout);

    console.log("Инициализация Personal Link Aggregator завершена.");
    console.log("------------------------------------------");
});
