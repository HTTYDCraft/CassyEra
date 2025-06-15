// main.js - Основной JavaScript-файл для Personal Link Aggregator
// Версия v10 (разделенные файлы, имитация данных, Skinview3D как ES-модуль, полная локализация, Material Symbols, гибкая конфигурация)

// Импорт конфигурационных файлов
import { appConfig, profileConfig, linksConfig } from '../config.js'; // Исправлен путь
import { strings } from '../strings.js'; // Исправлен путь

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
    handleLiveStreamLayout(); // Обновляем расположение стрима при смене языка/макета
};

/**
 * @function formatCount
 * @param {number} num - Число для форматирования (например, количество подписчиков).
 * @returns {string} Отформатированная строка числа (например, "123.4K", "1.2M", "500").
 * Если число равно `null` или `NaN`, возвращает локализованную строку "Загрузка...".
 */
const formatCount = (num) => {
    if (num === null || isNaN(num)) return strings[currentLang].loading;
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
        const response = await fetch('./data.json?t=' + Date.now()); // Путь к data.json в корне
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
            "followerCounts": {
                "youtube": null, // Используем null для индикации, что данные не загружены
                "telegram": null,
                "instagram": null,
                "x": null,
                "twitch": null,
                "tiktok": null,
                "vk_group": null,
                "vk_personal": null
            },
            "youtubeVideos": [],
            "liveStream": {
                "type": "none" // Нет активного стрима
            },
            "lastUpdated": new Date().toISOString(),
            "debugInfo": {
                "message": "Data loaded from client-side fallback due to data.json fetch error.",
                "status": "ERROR - Data.json failed to load",
                "error": error.message,
                "version": "client-fallback"
            }
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
                console.log(`[Links] Используется локальная иконка для ${link.label_key}: ${link.customIconUrl}`);
            } else if (link.icon) {
                iconHtml = `<span class="material-symbols-outlined icon-large">${link.icon}</span>`;
                console.log(`[Links] Используется Material Symbol для ${link.label_key}: ${link.icon}`);
            } else {
                // Fallback если нет ни Material Symbol, ни локальной иконки
                iconHtml = `<span class="material-symbols-outlined icon-large">link</span>`;
                console.warn(`[Links] Нет иконки для ${link.label_key}, используется иконка по умолчанию 'link'.`);
            }
            // Формируем HTML для счетчика подписчиков
            let followerCountHtml = '';
            if (link.isSocial && link.showSubscriberCount) {
                const count = appData.followerCounts ? appData.followerCounts[link.platformId] : undefined;
                followerCountHtml = `<span class="text-sm text-gray-400 mr-2 follower-count-display">${formatCount(count)}</span>`;
            }
            // Вставляем сгенерированный HTML в карточку
            card.innerHTML = `
                <div class="flex items-center">
                    ${iconHtml}
                    <div>
                        <span class="block text-lg font-medium">${strings[currentLang][link.label_key] || link.label_key}</span>
                        ${link.isSocial && link.showSubscriberCount ? followerCountHtml : ''}
                    </div>
                </div>
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
 * @function handleLiveStreamLayout
 * Управляет расположением секции прямой трансляции в зависимости от ширины экрана и ориентации.
 * На широких экранах (ПК в альбомной ориентации) секция стрима и скина группируются справа.
 * На узких экранах (мобильные или ПК в портретной ориентации) секция стрима размещается выше, после профиля.
 * Также контролирует общую видимость блока медиа на ПК.
 */
const handleLiveStreamLayout = () => {
    const isDesktopHorizontal = window.matchMedia("(min-width: 768px) and (orientation: landscape)").matches;
    // Определяем, должен ли блок стрима вообще быть показан
    const shouldShowLiveStream = appConfig.showLiveStreamSection && appData.liveStream && appData.liveStream.type !== 'none';
    if (shouldShowLiveStream) {
        if (isDesktopHorizontal) {
            // Перемещаем секцию стрима в media-block-desktop
            if (DOM.mediaBlockDesktop && !DOM.mediaBlockDesktop.contains(DOM.liveStreamSection)) {
                DOM.mediaBlockDesktop.prepend(DOM.liveStreamSection); // Добавляем стрим в начало media-block-desktop
            }
            setVisibility(DOM.liveStreamSection, true); // Показываем стрим на ПК
            DOM.liveStreamSection.classList.add('md-visible'); // Добавляем класс для видимости на ПК
        } else {
            // Перемещаем секцию стрима обратно в основное место для мобильных/вертикального ПК
            if (DOM.liveStreamSection && DOM.profileSection && DOM.profileSection.nextSibling) {
                const currentParent = DOM.liveStreamSection.parentNode;
                if (currentParent !== DOM.mainView) { // Если не на месте, перемещаем
                    // Вставляем секцию стрима после секции профиля (для мобильных)
                    DOM.mainView.insertBefore(DOM.liveStreamSection, DOM.profileSection.nextSibling);
                }
            }
            setVisibility(DOM.liveStreamSection, true); // Показываем стрим на мобильных
            DOM.liveStreamSection.classList.remove('md-visible'); // Удаляем класс ПК-видимости
        }
        displayLiveStreamContent(appData.liveStream); // Отображаем контент стрима
    } else {
        // Если стрим не активен или не должен отображаться, скрываем его везде
        setVisibility(DOM.liveStreamSection, false);
        DOM.liveStreamSection.classList.remove('md-visible');
    }
    // Управление видимостью media-block-desktop
    if (DOM.mediaBlockDesktop) {
        // Показываем media-block-desktop только если это ПК и должен быть скин или стрим
        const showMediaBlock = isDesktopHorizontal &&
            (appConfig.showMinecraftSkinSection || shouldShowLiveStream);
        setVisibility(DOM.mediaBlockDesktop, showMediaBlock);
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
        console.log("[Render] Активен YouTube Live Stream.");
    } else if (streamInfo.type === 'twitch' && streamInfo.twitchChannelName) {
        // Если активен Twitch стрим, встраиваем его
        if (DOM.liveEmbed) DOM.liveEmbed.src = `https://player.twitch.tv/?channel=${streamInfo.twitchChannelName}&parent=${window.location.hostname}&autoplay=true&mute=false`;
        console.log("[Render] Активен Twitch Live Stream.");
    } else {
        // Нет активных стримов
        console.log("[Render] Нет активных прямых трансляций для отображения.");
    }
};

/**
 * @function manageFirstVisitModal
 * Управляет отображением модального окна с инструкциями для первого посещения.
 * Модальное окно показывается только один раз, затем его состояние сохраняется в `localStorage`.
 */
const manageFirstVisitModal = () => {
    // Убедитесь, что модальное окно существует в DOM
    if (!DOM.firstVisitModal) {
        console.warn("[Modal] Модальное окно первого посещения не найдено в DOM.");
        return;
    }

    const hasVisited = localStorage.getItem('visited_modal');
    if (!hasVisited) {
        // Проверяем, что все DOM элементы внутри модального окна существуют
        if (DOM.modalTitle && DOM.modalDescription && DOM.modalCloseBtn) {
            setVisibility(DOM.firstVisitModal, true);
            DOM.modalCloseBtn.onclick = () => {
                setVisibility(DOM.firstVisitModal, false);
                localStorage.setItem('visited_modal', 'true');
                console.log("[Modal] Модальное окно первого посещения закрыто.");
            };
            console.log("[Modal] Показано модальное окно первого посещения.");
        } else {
            console.error("[Modal] Отсутствуют элементы внутри модального окна первого посещения. Модальное окно не будет показано.");
            setVisibility(DOM.firstVisitModal, false); // Скрываем, если не все элементы найдены
        }
    } else {
        setVisibility(DOM.firstVisitModal, false);
        console.log("[Modal] Модальное окно первого посещения не показано (уже посещено).");
    }
};

/**
 * @function initSwipeGestures
 * Инициализирует жесты свайпа (как для мыши, так и для касания) для карточек ссылок с классом `swipe-target`.
 * Позволяет пользователям выполнять действия (подписка/открытие видео) с помощью свайпов.
 * Обрабатывает `mousedown`, `mousemove`, `mouseup`, `mouseleave`, `touchstart`, `touchmove`, `touchend`.
 */
const initSwipeGestures = () => {
    const swipeTargets = document.querySelectorAll('.swipe-target');
    console.log(`[Gestures] Инициализация жестов свайпа для ${swipeTargets.length} элементов.`);
    swipeTargets.forEach(card => {
        let startX = 0;
        let startY = 0; // Добавлено для отслеживания вертикального движения
        let currentX = 0;
        let currentY = 0; // Добавлено для отслеживания вертикального движения
        let isSwiping = false;
        let swipeStarted = false; // Флаг, указывающий, начался ли горизонтальный свайп (преодолен порог)

        const linkData = linksConfig.find(link => link.label_key === card.getAttribute('data-link-id'));
        if (!linkData) {
            console.warn(`[Gestures] Данные ссылки не найдены для карточки с label_key: ${card.getAttribute('data-link-id')}. Свайп-жесты не будут работать для этой карточки.`);
            return;
        }

        /**
         * @function handleStart
         * Обработчик начала касания/нажатия мыши.
         * Устанавливает начальную позицию и флаг свайпа.
         * @param {Event} e - Событие (TouchEvent или MouseEvent).
         */
        const handleStart = (e) => {
            isSwiping = true;
            swipeStarted = false; // Сбрасываем флаг начала свайпа
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            startY = e.touches ? e.touches[0].clientY : e.clientY; // Захватываем начальную Y-координату
            card.style.transition = 'none'; // Отключаем CSS-переход во время активного свайпа
        };

        /**
         * @function handleMove
         * Обработчик движения касания/мыши во время свайпа.
         * Обновляет позицию карточки и применяет классы для визуальной обратной связи.
         * Учитывает доминирующее направление движения для предотвращения конфликтов со скроллом.
         * @param {Event} e - Событие (TouchEvent или MouseEvent).
         */
        const handleMove = (e) => {
            if (!isSwiping) return;

            currentX = e.touches ? e.touches[0].clientX : e.clientX;
            currentY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            const horizontalMoveThreshold = 30; // Порог в пикселях для начала горизонтального свайпа
            const verticalMoveTolerance = 0.5; // Насколько горизонтальным должен быть свайп (например, 0.5 означает deltaX > 0.5 * deltaY)

            // Если свайп еще не начат (не преодолен горизонтальный порог)
            if (!swipeStarted) {
                // Если вертикальное движение значительно больше горизонтального, считаем это скроллом
                if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) { // Порог 10px для начала скролла
                    isSwiping = false; // Прекращаем отслеживать как свайп
                    card.style.transform = 'translateX(0)'; // Сбрасываем любое случайное горизонтальное смещение
                    card.classList.remove('swiping-left', 'swiping-right');
                    // НЕ вызываем e.preventDefault(), чтобы разрешить нативный скролл
                    return;
                }
                // Если горизонтальное движение превышает порог И оно достаточно доминирует над вертикальным
                else if (Math.abs(deltaX) > horizontalMoveThreshold && Math.abs(deltaX) > (Math.abs(deltaY) * verticalMoveTolerance)) {
                    swipeStarted = true; // Свайп официально начат
                    e.preventDefault(); // Предотвращаем дефолтное поведение (скролл)
                }
                // Если движение слишком маленькое, чтобы определить направление, ничего не делаем
                else if (Math.abs(deltaX) <= horizontalMoveThreshold && Math.abs(deltaY) <= 10) { // Порог 10px для незначительных движений
                    return;
                }
            }

            if (swipeStarted) {
                e.preventDefault(); // Продолжаем предотвращать дефолтное поведение (скролл), если свайп уже начался
                card.style.transform = `translateX(${deltaX}px)`;
                card.classList.remove('swiping-left', 'swiping-right');
                if (deltaX > 0) {
                    card.classList.add('swiping-right');
                } else {
                    card.classList.add('swiping-left');
                }
            }
        };

        /**
         * @function handleEnd
         * Обработчик завершения касания/отпускания кнопки мыши.
         * Определяет, был ли выполнен достаточный свайп, и выполняет соответствующее действие (открытие URL).
         * Сбрасывает состояние свайпа и включает обратно CSS-переходы.
         */
        const handleEnd = () => {
            if (!isSwiping && !swipeStarted) { // Если не было активного свайпа или он был отменен как скролл
                card.style.transform = 'translateX(0)'; // Убеждаемся, что карточка возвращается на место
                card.classList.remove('swiping-left', 'swiping-right');
                card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease';
                return;
            }

            isSwiping = false;
            card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease'; // Включаем CSS-переходы обратно
            card.classList.remove('swiping-left', 'swiping-right');

            const deltaX = currentX - startX; // Пересчитываем на основе конечных позиций
            const swipeThreshold = card.offsetWidth * 0.25; // Порог свайпа 25% ширины карточки

            if (swipeStarted && Math.abs(deltaX) > swipeThreshold) { // Действуем только если свайп был инициирован и преодолел порог
                if (deltaX > 0) { // Свайп вправо: подписка или основная ссылка
                    const targetUrl = linkData.subscribeUrl || linkData.url;
                    window.open(targetUrl, '_blank');
                    console.log(`[Gestures] Свайп вправо на ${strings[currentLang][linkData.label_key] || linkData.label_key}, открытие: ${targetUrl}`);
                } else { // Свайп влево: последнее видео/стрим YouTube или основная ссылка
                    if (linkData.platformId === 'youtube') {
                        const liveStream = appData.liveStream;
                        if (liveStream && liveStream.type === 'youtube' && liveStream.id) {
                            window.open(`https://www.youtube.com/watch?v=${liveStream.id}`, '_blank');
                            console.log(`[Gestures] Свайп влево на YouTube, открытие прямого эфира: ${liveStream.id}`);
                        } else if (appData.youtubeVideos && appData.youtubeVideos.length > 0) {
                            window.open(`https://www.youtube.com/watch?v=${appData.youtubeVideos[0].id}`, '_blank');
                            console.log(`[Gestures] Свайп влево на YouTube, открытие последнего видео: ${appData.youtubeVideos[0].id}`);
                        } else {
                            window.open(linkData.url, '_blank');
                            console.log(`[Gestures] Свайп влево на YouTube, нет видео/стримов, открытие канала: ${linkData.url}`);
                        }
                    } else {
                        window.open(linkData.url, '_blank');
                        console.log(`[Gestures] Свайп влево на ${strings[currentLang][linkData.label_key] || linkData.label_key}, открытие: ${linkData.url}`);
                    }
                }
            }
            card.style.transform = 'translateX(0)'; // Сброс позиции карточки (возврат на место)
            swipeStarted = false; // Сбрасываем для следующего взаимодействия
        };

        /**
         * @private _handleClickForPreview
         * Переопределенный обработчик клика, который учитывает флаг `swipeStarted`.
         * Это предотвращает ложные срабатывания клика, если пользователь выполнял свайп, а не чистый тап/клик.
         * Либо показывает предпросмотр, либо позволяет стандартному действию ссылки произойти (если предпросмотр уже открыт).
         */
        card._handleClickForPreview = (e) => {
            if (swipeStarted) { // Если свайп-жест был инициирован (swipeStarted стало true), предотвращаем клик
                e.preventDefault();
                // swipeStarted = false; // Не сбрасываем здесь, это делает handleEnd
                return;
            }
            // Если свайп не начинался, то это обычный клик/тап
            // Если предпросмотр уже показан для этой ссылки, то открыть ссылку
            // Иначе, показать предпросмотр
            if (DOM.linkPreviewModal.classList.contains('active') && DOM.linkPreviewModal.dataset.currentLinkKey === linkData.label_key) {
                // Разрешаем дефолтное поведение, так как это второй тап/клик на той же ссылке
                // (первый открыл предпросмотр, второй - саму ссылку)
            } else {
                e.preventDefault(); // Предотвращаем дефолтное действие ссылки
                showLinkPreview(linkData);
            }
        };

        // Привязываем слушатели событий для мыши и касаний
        card.addEventListener('mousedown', handleStart);
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseup', handleEnd);
        card.addEventListener('mouseleave', handleEnd);

        // Для touch-событий: passive: false позволяет вызывать preventDefault
        card.addEventListener('touchstart', handleStart, { passive: false });
        card.addEventListener('touchmove', handleMove, { passive: false });
        card.addEventListener('touchend', handleEnd);

        // Клик слушатель добавляется один раз
        card.addEventListener('click', card._handleClickForPreview);
    });
};

/**
 * @function initMinecraftSkinViewer
 * Инициализирует 3D-просмотрщик скина Minecraft с помощью библиотеки Skinview3D.
 * Проверяет доступность импортированного модуля `skinview3d` перед инициализацией.
 * Устанавливает скин, анимацию ходьбы и орбитальные элементы управления для интерактивного вращения и масштабирования.
 * Добавляет `ResizeObserver` для адаптации размера канваса при изменении размера контейнера.
 */
const initMinecraftSkinViewer = () => {
    // Скрываем секцию, если она не должна быть показана согласно конфигу.
    if (!appConfig.showMinecraftSkinSection) {
        setVisibility(DOM.minecraftBlock, false);
        if (skinViewerInstance) {
            skinViewerInstance.dispose();
            skinViewerInstance = null;
            console.log("[SkinViewer] 3D-просмотрщик скина Minecraft отключен и очищен.");
        }
        return;
    }
    // Проверяем наличие необходимых DOM-элементов
    if (!DOM.skinCanvas || !DOM.skinViewerContainer) {
        console.error("[SkinViewer] Отсутствуют необходимые DOM-элементы (canvas или контейнер) для просмотрщика скина. Инициализация невозможна.");
        setVisibility(DOM.minecraftBlock, false);
        return;
    }
    // Проверяем, загружен ли модуль skinview3d.
    if (typeof skinview3d === 'undefined' || typeof skinview3d.SkinViewer === 'undefined') {
        console.error("[SkinViewer] Библиотека skinview3d не загружена или недоступна. 3D просмотр скина невозможен.");
        console.error(strings[currentLang].skinViewerLoadError);
        setVisibility(DOM.minecraftBlock, false);
        return;
    }
    // Если экземпляр уже существует, очищаем его, чтобы избежать дублирования.
    if (skinViewerInstance) {
        skinViewerInstance.dispose();
        skinViewerInstance = null;
        console.log("[SkinViewer] Предыдущий экземпляр SkinViewer3D очищен.");
    }
    try {
        // Создаем новый экземпляр SkinViewer.
        skinViewerInstance = new skinview3d.SkinViewer({
            canvas: DOM.skinCanvas,
            width: DOM.skinViewerContainer.offsetWidth,
            height: DOM.skinViewerContainer.offsetHeight,
            // Добавляем фоновый цвет, чтобы избежать прозрачности по умолчанию
            // background: 0x000000, // Пример черного фона
            // transparent: false,
        });

        // Загружаем скин
        skinViewerInstance.loadSkin(profileConfig.minecraftSkinUrl, {
            // Дополнительные параметры загрузки, если нужны
        })
            .then(() => {
                console.log("[SkinViewer] Скин успешно загружен.");
                // Устанавливаем анимацию ходьбы
                skinViewerInstance.animation = new skinview3d.WalkingAnimation();
                skinViewerInstance.zoom = 1; // Начальное масштабирование
                // Применяем орбитальные элементы управления для интерактивного вращения и масштабирования.
                skinview3d.createOrbitControls(skinViewerInstance);
            })
            .catch(error => {
                console.error("[SkinViewer] Ошибка загрузки скина:", error);
                console.error(strings[currentLang].skinViewerLoadError);
                setVisibility(DOM.minecraftBlock, false); // Скрываем блок при ошибке загрузки скина
            });

        // Добавляем ResizeObserver для автоматического изменения размера канваса при изменении размера его контейнера.
        // Это обеспечивает адаптивность 3D-просмотрщика.
        new ResizeObserver(() => {
            if (DOM.skinViewerContainer && skinViewerInstance) {
                skinViewerInstance.setSize(
                    DOM.skinViewerContainer.offsetWidth,
                    DOM.skinViewerContainer.offsetHeight
                );
                console.log("[SkinViewer] Canvas изменен в размере и SkinViewer3D адаптирован.");
            }
        }).observe(DOM.skinViewerContainer);
        // Делаем секцию видимой, если инициализация прошла успешно (даже если скин еще грузится).
        setVisibility(DOM.minecraftBlock, true);
        // Добавляем слушатель для кнопки скачивания скина.
        if (DOM.downloadSkinButton) DOM.downloadSkinButton.addEventListener('click', downloadMinecraftSkin);
        console.log("[SkinViewer] 3D-просмотрщик скина Minecraft инициализирован и настроен.");
    } catch (error) {
        // Логируем любые ошибки, возникающие во время инициализации Skinview3D.
        console.error("[SkinViewer] Ошибка при инициализации 3D-просмотрщика скина (SkinViewer3D):", error);
        console.error(strings[currentLang].skinViewerLoadError);
        setVisibility(DOM.minecraftBlock, false); // Скрываем секцию в случае критической ошибки инициализации
    }
};

/**
 * @function downloadMinecraftSkin
 * Запускает процесс скачивания PNG-файла скина Minecraft.
 * Создает временную ссылку (`<a>`), устанавливает её `href` и `download` атрибуты,
 * имитирует клик и удаляет ссылку.
 */
const downloadMinecraftSkin = () => {
    if (profileConfig.minecraftSkinUrl) {
        const a = document.createElement('a');
        a.href = profileConfig.minecraftSkinUrl;
        a.download = 'minecraft_skin.png'; // Имя файла для скачивания
        document.body.appendChild(a); // Необходимо добавить в DOM для вызова click()
        a.click(); // Имитируем клик
        document.body.removeChild(a); // Удаляем элемент
        console.log("[Download] Попытка скачать скин Minecraft.");
    } else {
        console.warn("[Download] URL скина Minecraft не задан в profileConfig. Скачивание невозможно.");
    }
};

/**
 * @function setupSupportButton
 * Настраивает видимость кнопки поддержки/доната и устанавливает её URL (если применимо).
 * Видимость контролируется `appConfig.showSupportButton`.
 */
const setupSupportButton = () => {
    setVisibility(DOM.supportSection, appConfig.showSupportButton);
    if (appConfig.showSupportButton) {
        // Если у вас есть URL для поддержки, добавьте его в appConfig.
        // Пример: appConfig.supportUrl = "https://boosty.to/your_channel";
        if (DOM.supportButton) DOM.supportButton.href = appConfig.supportUrl || "#"; // Fallback к #
        if (DOM.supportButtonText) DOM.supportButtonText.textContent = strings[currentLang].supportButton;
        console.log("[Render] Кнопка поддержки настроена.");
    }
};

/**
 * @function renderDevPage
 * Рендерит содержимое страницы разработчика.
 * Отображает информацию о последнем обновлении данных, содержимое `data.json` (имитация)
 * и отладочную информацию API.
 */
const renderDevPage = () => {
    if (DOM.devLastUpdated) DOM.devLastUpdated.textContent = appData.lastUpdated ? new Date(appData.lastUpdated).toLocaleString(currentLang) : 'N/A';
    if (DOM.devDataJsonContent) DOM.devDataJsonContent.textContent = JSON.stringify(appData, null, 2);
    if (DOM.devDebugInfoContent) DOM.devDebugInfoContent.textContent = JSON.stringify(appData.debugInfo || {}, null, 2);
    console.log("[Render] Страница разработчика отрисована.");
};

/**
 * @function setupAnalytics
 * Настраивает аналитику (в данной версии является заглушкой).
 * Здесь можно добавить код для интеграции Google Analytics или другой системы аналитики.
 */
const setupAnalytics = () => {
    console.log("[Analytics] Настройка заглушки Google Analytics...");
    // Здесь можно интегрировать реальный код Google Analytics
};

/**
 * @function showLinkPreview
 * @param {object} linkData - Объект данных ссылки, для которой показывается предпросмотр.
 * Отображает модальное окно предпросмотра ссылки с информацией из `profileConfig`
 * (имя, описание, аватар профиля, а также кнопка для открытия самой ссылки).
 */
const showLinkPreview = (linkData) => {
    if (!DOM.linkPreviewModal) {
        console.error("[Preview] Элемент модального окна предпросмотра ссылки не найден.");
        return;
    }
    // Останавливаем скрытие, если оно было запланировано предыдущим pointerleave
    clearTimeout(DOM.linkPreviewModal._hideTimeout);
    // Если предпросмотр уже открыт для этой же ссылки, не делаем ничего
    if (DOM.linkPreviewModal.classList.contains('active') && DOM.linkPreviewModal.dataset.currentLinkKey === linkData.label_key) {
        return;
    }
    // Заполняем содержимое модального окна данными профиля
    if (DOM.previewAvatar) DOM.previewAvatar.src = profileConfig.avatar;
    if (DOM.previewName) DOM.previewName.textContent = strings[currentLang][profileConfig.name_key]; // Локализация имени
    if (DOM.previewDescription) DOM.previewDescription.textContent = strings[currentLang][profileConfig.description_key]; // Локализация описания
    if (DOM.previewOpenLink) DOM.previewOpenLink.textContent = strings[currentLang].openLinkButton; // Локализация текста кнопки
    if (DOM.previewOpenLink) DOM.previewOpenLink.href = linkData.url; // Кнопка "Открыть ссылку" ведет на URL ссылки
    if (DOM.previewAvatar) DOM.previewAvatar.alt = strings[currentLang].previewAvatarAlt; // Локализация alt текста
    // Сохраняем ключ текущей ссылки в dataset модального окна для последующих проверок
    DOM.linkPreviewModal.dataset.currentLinkKey = linkData.label_key;
    setVisibility(DOM.linkPreviewModal, true); // Делаем модальное окно видимым
    DOM.linkPreviewModal.classList.add('active'); // Добавляем класс 'active' для применения стилей/анимаций
    // Добавляем слушатели для закрытия модального окна
    if (DOM.previewCloseButton) DOM.previewCloseButton.onclick = hideLinkPreview;
    if (DOM.previewCloseButton) DOM.previewCloseButton.textContent = strings[currentLang].closeButton; // Локализация текста кнопки
    // Добавляем слушатели для кликов по элементам внутри предпросмотра, чтобы открыть ссылку
    // Используем e.preventDefault(), чтобы не было дублирования открытия, если элемент является ссылкой.
    if (DOM.previewAvatar) DOM.previewAvatar.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewName) DOM.previewName.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewDescription) DOM.previewDescription.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    console.log(`[Preview] Показан предпросмотр ссылки для: ${strings[currentLang][linkData.label_key] || linkData.label_key}`);
};

/**
 * @function hideLinkPreview
 * Скрывает модальное окно предпросмотра ссылки с небольшой задержкой.
 * Очищает временные слушатели событий и данные.
 */
const hideLinkPreview = () => {
    // Небольшая задержка, чтобы предотвратить моргание при быстром движении курсора над ссылками
    DOM.linkPreviewModal._hideTimeout = setTimeout(() => {
        setVisibility(DOM.linkPreviewModal, false);
        DOM.linkPreviewModal.classList.remove('active'); // Удаляем класс 'active'
        DOM.linkPreviewModal.dataset.currentLinkKey = ''; // Очищаем ключ текущей ссылки
        // Удаляем обработчики событий, чтобы избежать утечек памяти
        if (DOM.previewCloseButton) DOM.previewCloseButton.onclick = null;
        if (DOM.previewAvatar) DOM.previewAvatar.onclick = null;
        if (DOM.previewName) DOM.previewName.onclick = null;
        if (DOM.previewDescription) DOM.previewDescription.onclick = null;
        console.log("[Preview] Предпросмотр ссылки скрыт.");
    }, 100);
};

// --- Инициализация приложения после полной загрузки DOM ---
/**
 * @event DOMContentLoaded
 * Главная точка входа для инициализации всего приложения.
 * Выполняется после того, как весь HTML-документ будет загружен и разобран.
 * Последовательно вызывает все функции для настройки UI, загрузки данных и инициализации интерактивных элементов.
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log("------------------------------------------");
    console.log("DOMContentLoaded: Запуск инициализации приложения Personal Link Aggregator.");

    // 1. Загрузка данных приложения
    appData = await fetchAppData();
    console.log("[Init] Данные приложения загружены:", appData);

    // 2. Рендеринг секции профиля.
    renderProfileSection();

    // 3. Применение начальной темы и языка.
    // `updateLanguage` также вызовет `renderLinksSection` и `calculateAndDisplayTotalFollowers`.
    applyTheme(currentTheme);
    updateLanguage();

    // 4. Настройка и видимость переключателя темы.
    setVisibility(DOM.themeToggle, appConfig.showThemeToggle);
    if (appConfig.showThemeToggle && DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', currentTheme); // Сохраняем тему в localStorage
            applyTheme(currentTheme);
            console.log(`[Event] Тема переключена на: ${currentTheme}`);
        });
        console.log("[Init] Переключатель темы настроен.");
    } else {
        console.warn("[Init] Элемент переключателя темы не найден или скрыт согласно конфигурации.");
    }

    // 5. Настройка и видимость переключателя языка.
    setVisibility(DOM.languageToggle, appConfig.showLanguageToggle);
    if (appConfig.showLanguageToggle && DOM.languageToggle) {
        DOM.languageToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ru' : 'en';
            localStorage.setItem('lang', currentLang);
            updateLanguage(); // Обновить весь текст UI после смены языка
            console.log(`[Event] Язык переключен на: ${currentLang}`);
        });
        console.log("[Init] Переключатель языка настроен.");
    } else {
        console.warn("[Init] Элемент переключателя языка не найден или скрыт согласно конфигурации.");
    }

    // 6. Настройка и видимость режима разработчика.
    setVisibility(DOM.devToggle, appConfig.developmentMode && appConfig.showDevToggle);
    if (appConfig.developmentMode && appConfig.showDevToggle && DOM.devToggle) {
        DOM.devToggle.addEventListener('click', () => {
            renderView(isDevViewActive ? 'main' : 'dev'); // Переключаем на противоположный вид.
            console.log("[Event] Кнопка Dev нажата. Переключение вида.");
        });
        if (DOM.backToMainButton) {
            DOM.backToMainButton.addEventListener('click', () => {
                renderView('main');
                console.log("[Event] Кнопка 'Назад к сайту' нажата. Переключение на основной вид.");
            });
        }
        console.log("[Init] Режим разработчика настроен.");
    } else {
        console.warn("[Init] Режим разработчика отключен или кнопка не найдена/скрыта согласно конфигурации.");
    }

    // Выполняем начальную проверку хэша URL для прямого доступа к виду разработчика.
    const initialHash = window.location.hash;
    if (initialHash === '#/dev' && appConfig.developmentMode) {
        renderView('dev');
    } else {
        renderView('main');
    }

    // 7. Инициализация Minecraft Skin Viewer.
    // Используем `setTimeout` с проверкой доступности `skinview3d`,
    // так как импорт модуля может занять некоторое время.
    const checkSkinViewerReadyTimeout = setTimeout(() => {
        if (typeof skinview3d !== 'undefined' && typeof skinview3d.SkinViewer !== 'undefined') {
            initMinecraftSkinViewer();
        } else {
            console.error("[Init] Библиотека skinview3d не загрузилась вовремя. Просмотрщик скина не будет инициализирован.");
            console.error(strings[currentLang].skinViewerLoadError); // Добавляем сообщение об ошибке
            setVisibility(DOM.minecraftBlock, false); // Скрываем блок, если библиотека не загрузилась
        }
    }, 100); // Уменьшена задержка, так как CDN стабилен

    // 8. Настройка кнопки поддержки.
    setupSupportButton();
    console.log("[Init] Кнопка поддержки настроена.");

    // 9. Рендеринг видео YouTube.
    renderYouTubeVideosSection();
    console.log("[Init] Секция видео YouTube настроена.");

    // 10. Управление расположением секции стрима.
    handleLiveStreamLayout();
    // Добавляем слушатель события `resize` для адаптации макета при изменении размера окна.
    window.addEventListener('resize', handleLiveStreamLayout);
    console.log("[Init] Управление расположением Live Stream настроено.");

    // 11. Управление модальным окном первого посещения.
    manageFirstVisitModal();
    console.log("[Init] Модальное окно первого посещения настроено.");

    // 12. Настройка аналитики (заглушка).
    setupAnalytics();
    console.log("[Init] Аналитика настроена.");
    console.log("Инициализация Personal Link Aggregator завершена.");
    console.log("------------------------------------------");
});
