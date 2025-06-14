// links/js/main.js
// Основной JavaScript-файл для Personal Link Aggregator
// ПЕРЕПИСАННЫЙ КОД - v13 (с кастомным просмотрщиком скинов)

// Импортируем конфигурационные данные и текстовые строки из отдельных файлов
// Убедитесь, что links/js/config.js и links/js/strings.js доступны и корректно сформированы
import { appConfig, profileConfig, linksConfig } from './config.js';
import { strings } from './strings.js';

// --- DOM Element References ---
// Все ссылки на DOM-элементы собираем здесь для удобства и избежания повторных запросов
const DOM = {
    // Контейнеры основных секций приложения
    appContainer: document.getElementById('app'),
    mainView: document.getElementById('main-view'),
    devView: document.getElementById('dev-view'),
    offlineWarning: document.getElementById('offline-warning'),
    offlineMessage: document.getElementById('offline-message'),

    // Секция прямой трансляции
    liveStreamSection: document.getElementById('live-stream-section'),
    liveEmbed: document.getElementById('live-embed'), // iframe для стрима
    twitchNotification: document.getElementById('twitch-notification'), // Уведомление о Twitch
    twitchMessage: document.getElementById('twitch-message'),
    twitchLink: document.getElementById('twitch-link'),
    twitchLinkText: document.getElementById('twitch-link-text'),

    // Секция профиля
    profileSection: document.getElementById('profile-section'),
    avatar: document.getElementById('avatar'),
    profileName: document.getElementById('profile-name'),
    profileDescription: document.getElementById('profile-description'),
    totalFollowers: document.getElementById('total-followers'),

    // Секция ссылок
    linksSection: document.getElementById('links-section'),
    
    // Секция кнопки поддержки/доната
    supportSection: document.getElementById('support-section'),
    supportButton: document.getElementById('support-button'),
    supportButtonText: document.getElementById('support-button-text'),

    // Секция просмотра скина Minecraft (кастомная реализация на Canvas)
    minecraftBlock: document.getElementById('minecraft-block'), 
    minecraftTitle: document.getElementById('minecraft-title'),
    skinViewerContainer: document.getElementById('skin-viewer-container'),
    skinCanvas: document.getElementById('skin-canvas'), // Canvas для рендеринга скина
    downloadSkinButton: document.getElementById('download-skin-button'),
    downloadSkinText: document.getElementById('download-skin-text'),

    // Секция последних видео YouTube
    youtubeVideosSection: document.getElementById('youtube-videos-section'),
    recentVideosTitle: document.getElementById('recent-videos-title'),
    videoCarousel: document.getElementById('video-carousel'),

    // Глобальные элементы управления (тема, язык, режим разработчика)
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    languageToggle: document.getElementById('language-toggle'),
    devToggle: document.getElementById('dev-toggle'),
    backToMainButton: document.getElementById('back-to-main-button'),
    devTitle: document.getElementById('dev-title'),
    devLastUpdatedLabel: document.getElementById('dev-last-updated-label'),
    devDataJsonContentLabel: document.getElementById('dev-data-json-content-label'),
    devDataJsonContent: document.getElementById('dev-data-json-content'),
    devDebugInfoContentLabel: document.getElementById('dev-debug-info-content-label'),
    devDebugInfoContent: document.getElementById('dev-debug-info-content'),
    backToMainText: document.getElementById('back-to-main-text'),

    // Модальное окно первого посещения
    firstVisitModal: document.getElementById('first-visit-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalDescription: document.getElementById('modal-description'),
    modalCloseBtn: document.getElementById('modal-close'),

    // Модальное окно предпросмотра ссылки
    linkPreviewModal: document.getElementById('link-preview-modal'),
    previewAvatar: document.getElementById('preview-avatar'),
    previewName: document.getElementById('preview-name'),
    previewDescription: document.getElementById('preview-description'),
    previewOpenLink: document.getElementById('preview-open-link'),
    previewCloseButton: document.getElementById('preview-close-button'),
};

// --- Состояние приложения ---
let currentTheme = localStorage.getItem('theme') || 'dark'; // Текущая тема: темная по умолчанию
let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ru') ? 'ru' : 'en'); // Текущий язык: русский по умолчанию, если браузер русский
let appData = {}; // Данные, загруженные из data.json

// --- Переменные для кастомного просмотрщика скинов ---
let skinImage = new Image(); // Объект изображения для скина
let skinImageLoaded = false; // Флаг загрузки изображения скина
let skinYaw = 0; // Угол поворота скина по горизонтали (yaw)
let skinAnimationFrameId = null; // ID для requestAnimationFrame

// --- Вспомогательные функции ---

/**
 * Управляет видимостью DOM-элемента, добавляя или удаляя класс 'hidden'.
 * @param {HTMLElement} element - DOM-элемент, которым нужно управлять.
 * @param {boolean} isVisible - Если true, элемент виден (класс 'hidden' удален). Если false, скрыт.
 */
const setVisibility = (element, isVisible) => {
    if (element) { // Проверяем, существует ли элемент перед тем, как с ним работать
        if (isVisible) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
};

/**
 * Переключает отображение между основным видом и видом разработчика.
 * @param {string} view - 'main' для основного вида, 'dev' для вида разработчика.
 */
const renderView = (view) => {
    setVisibility(DOM.mainView, view === 'main');
    setVisibility(DOM.devView, view === 'dev');
    if (view === 'dev') {
        renderDevPage(); // Рендерим страницу разработчика, если она активирована
    }
};

/**
 * Обработчик изменения хэша URL для переключения между основным видом и видом разработчика.
 */
const handleHashChange = () => {
    if (window.location.hash === '#/dev' && appConfig.developmentMode) {
        renderView('dev');
    } else {
        renderView('main');
    }
};

/**
 * Применяет выбранную тему (темную или светлую) к тегу <body> документа.
 * Также обновляет иконку переключателя темы и атрибут aria-label.
 * @param {string} theme - 'dark' или 'light'.
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
 * Обновляет весь динамический текстовый контент в пользовательском интерфейсе
 * на основе текущего выбранного языка.
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
    if (DOM.backToMainText) DOM.backToMainText.textContent = strings[currentLang].backToMainText;

    // После обновления языка, перерендерим компоненты, которые используют текстовые строки
    renderLinksSection(linksConfig); 
    calculateAndDisplayTotalFollowers(); // Пересчитываем и отображаем подписчиков (текст "Всего подписчиков")
    applyTheme(currentTheme); // Повторно применяем тему для обновления атрибута aria-label
};

/**
 * Форматирует число в удобочитаемую строку (например, 1234567 -> 1.23M).
 * @param {number} num - Число для форматирования.
 * @returns {string} Отформатированная строка числа.
 */
const formatCount = (num) => {
    if (num === null || isNaN(num)) return strings[currentLang].loading;
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

/**
 * Вычисляет и отображает общее количество подписчиков, суммируя данные из appData и кэша.
 */
const calculateAndDisplayTotalFollowers = () => {
    let total = 0;
    let allCountsAvailable = true;
    const sourceCounts = appData.followerCounts || {};

    // Проходим по всем ссылкам в конфигурации, чтобы суммировать подписчиков
    for (const link of linksConfig) {
        if (link.isSocial && link.showSubscriberCount && link.active) {
            const count = sourceCounts[link.platformId];
            if (typeof count === 'number') {
                total += count;
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
        if (allCountsAvailable) {
            if (DOM.totalFollowers) DOM.totalFollowers.textContent = `${strings[currentLang].totalFollowers}${formatCount(total)}`;
        } else {
            if (DOM.totalFollowers) DOM.totalFollowers.textContent = `${strings[currentLang].totalFollowers}${strings[currentLang].loading}`;
        }
    }
};

/**
 * Получает данные из data.json. Сначала проверяет наличие подключения к интернету.
 * Если оффлайн, пытается использовать кэшированные данные из localStorage.
 * В случае успеха, кэширует полученные данные.
 * @returns {Promise<Object>} Promise, который разрешается в объект данных.
 */
const fetchAppData = async () => {
    const cacheKey = 'app_data_cache';
    const cachedData = localStorage.getItem(cacheKey);

    if (!navigator.onLine) {
        // Если нет подключения к интернету
        setVisibility(DOM.offlineWarning, true);
        if (cachedData) {
            console.warn("[Data Fetch] Оффлайн, использование кэшированных данных.");
            try { return JSON.parse(cachedData); } catch { return {}; }
        } else {
            console.error("[Data Fetch] Оффлайн и нет доступного кэша. Невозможно загрузить данные.");
            return {};
        }
    } else {
        // Если есть подключение к интернету, скрываем предупреждение
        setVisibility(DOM.offlineWarning, false);
    }

    try {
        console.log("[Data Fetch] Загрузка новых данных из data.json...");
        // Добавляем параметр времени для обхода кэша браузера и получения самых свежих данных
        const response = await fetch(`${appConfig.dataUrl}?t=${Date.now()}`); 
        if (!response.ok) {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data)); // Кэшируем новые данные
        console.log("[Data Fetch] Данные успешно загружены.");
        return data;
    } catch (error) {
        console.error("Ошибка при загрузке данных приложения:", error);
        if (cachedData) {
            console.warn("[Data Fetch] Ошибка при загрузке новых данных, использование кэшированных данных.");
            try { return JSON.parse(cachedData); } catch { return {}; }
        }
        return {};
    }
};

/**
 * Рендерит секцию профиля, отображая аватар, имя и описание из profileConfig.
 */
const renderProfileSection = () => {
    setVisibility(DOM.profileSection, appConfig.showProfileSection);
    if (appConfig.showProfileSection) {
        if (DOM.avatar) DOM.avatar.src = profileConfig.avatar;
        if (DOM.profileName) DOM.profileName.textContent = profileConfig.name;
        if (DOM.profileDescription) DOM.profileDescription.textContent = profileConfig.description;
        console.log("[Render] Секция профиля отрисована.");
    }
};

/**
 * Рендерит карточки ссылок в секции links-section на основе linksConfig.
 * Включает логику для Simple Icons и подсчета подписчиков.
 * @param {Array<Object>} links - Массив объектов ссылок из linksConfig.
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

            // Формируем HTML для иконки
            let iconHtml = '';
            if (link.icon) {
                // Пытаемся получить SVG из библиотеки Simple Icons
                if (window.SimpleIcons && window.SimpleIcons.get) {
                    const simpleIcon = window.SimpleIcons.get(link.icon);
                    if (simpleIcon) {
                        iconHtml = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="si-icon" style="fill:#${simpleIcon.hex || 'currentColor'};"><title>${strings[currentLang][link.label_key] || link.label_key}</title><path d="${simpleIcon.path}"/></svg>`;
                    } else {
                        // Если Simple Icon не найден, используем иконку Material Symbols
                        iconHtml = `<span class="material-symbols-outlined text-2xl mr-4">${link.icon}</span>`;
                        console.warn(`Simple Icon '${link.icon}' не найден, используется Material Symbols.`);
                    }
                } else {
                    // Если библиотека Simple Icons не загружена вообще, используем Material Symbols
                    iconHtml = `<span class="material-symbols-outlined text-2xl mr-4">${link.icon}</span>`;
                    console.warn(`Библиотека SimpleIcons не загружена, используется Material Symbols для иконки '${link.icon}'.`);
                }
            }

            // Формируем HTML для счетчика подписчиков
            let followerCountHtml = '';
            if (link.isSocial && link.showSubscriberCount) {
                const count = appData.followerCounts ? appData.followerCounts[link.platformId] : undefined;
                followerCountHtml = `<span class="text-sm text-gray-400 mr-2 follower-count-display">${formatCount(count)}</span>`;
                if (typeof count === 'number') {
                    localStorage.setItem(`follower_count_${link.platformId}`, count.toString());
                }
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
 * Рендерит последние видео YouTube из appData.youtubeVideos.
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
 * Отображает встроенный плеер прямой трансляции и/или уведомление Twitch, используя данные из appData.liveStream.
 */
const displayLiveStreamSection = () => {
    const streamInfo = appData.liveStream || { type: 'none' };
    setVisibility(DOM.liveStreamSection, appConfig.showLiveStreamSection);

    if (appConfig.showLiveStreamSection) {
        if (DOM.liveEmbed) DOM.liveEmbed.src = ''; // Очищаем src на случай, если стрим закончился
        setVisibility(DOM.twitchNotification, false); // Скрываем уведомление Twitch по умолчанию

        if (streamInfo.type === 'youtube' && streamInfo.id) {
            // Если активен YouTube стрим, встраиваем его
            if (DOM.liveEmbed) DOM.liveEmbed.src = `https://www.youtube.com/embed/${streamInfo.id}?autoplay=1&mute=0&controls=1`;
            setVisibility(DOM.liveStreamSection, true);
            // Если есть сопутствующий стрим на Twitch, показываем уведомление
            if (streamInfo.twitchLive && streamInfo.twitchLive.twitchChannelName) {
                if (DOM.twitchMessage) DOM.twitchMessage.textContent = `${streamInfo.twitchLive.title} также в эфире на Twitch!`;
                if (DOM.twitchLink) DOM.twitchLink.href = `https://www.twitch.tv/${streamInfo.twitchLive.twitchChannelName}`;
                setVisibility(DOM.twitchNotification, true);
            }
            console.log("[Render] Активен YouTube Live Stream.");
        } else if (streamInfo.type === 'twitch' && streamInfo.twitchChannelName) {
            // Если активен Twitch стрим, встраиваем его
            if (DOM.liveEmbed) DOM.liveEmbed.src = `https://player.twitch.tv/?channel=${streamInfo.twitchChannelName}&parent=${window.location.hostname}&autoplay=true&mute=false`;
            setVisibility(DOM.liveStreamSection, true);
            console.log("[Render] Активен Twitch Live Stream.");
        } else {
            // Если нет активных стримов, скрываем секцию
            setVisibility(DOM.liveStreamSection, false); 
            console.log("[Render] Нет активных прямых трансляций.");
        }
    }
};

/**
 * Управляет модальным окном с инструкциями при первом посещении.
 * Показывается только один раз.
 */
const manageFirstVisitModal = () => {
    const hasVisited = localStorage.getItem('visited_modal');
    if (!hasVisited) {
        setVisibility(DOM.firstVisitModal, true);
        if (DOM.modalCloseBtn) DOM.modalCloseBtn.onclick = () => {
            setVisibility(DOM.firstVisitModal, false);
            localStorage.setItem('visited_modal', 'true');
        };
        console.log("[Modal] Показано модальное окно первого посещения.");
    } else {
        setVisibility(DOM.firstVisitModal, false);
        console.log("[Modal] Модальное окно первого посещения не показано (уже посещено).");
    }
};

/**
 * Инициализирует жесты свайпа (mouse and touch) для элементов с классом 'swipe-target'.
 * Позволяет выполнять действия (подписка/открытие видео) при свайпе.
 */
const initSwipeGestures = () => {
    const swipeTargets = document.querySelectorAll('.swipe-target');
    console.log(`[Gestures] Инициализация жестов свайпа для ${swipeTargets.length} элементов.`);
    
    swipeTargets.forEach(card => {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;
        let swipeStarted = false; // Флаг для отслеживания, был ли реальный свайп

        const linkData = linksConfig.find(link => link.label_key === card.getAttribute('data-link-id'));
        if (!linkData) {
            console.warn(`[Gestures] Данные ссылки не найдены для карточки с label_key: ${card.getAttribute('data-link-id')}`);
            return;
        }

        const handleStart = (e) => {
            isSwiping = true;
            swipeStarted = false; // Сбрасываем флаг начала свайпа
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            card.style.transition = 'none'; // Отключаем CSS-переход во время активного свайпа
        };

        const handleMove = (e) => {
            if (!isSwiping) return;
            currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - startX;

            if (Math.abs(deltaX) > 5) { // Минимальный порог для начала свайпа
                swipeStarted = true;
                card.style.transform = `translateX(${deltaX}px)`;

                card.classList.remove('swiping-left', 'swiping-right');
                if (deltaX > 20) {
                    card.classList.add('swiping-right');
                } else if (deltaX < -20) {
                    card.classList.add('swiping-left');
                }
            }
        };

        const handleEnd = () => {
            if (!isSwiping) return;
            isSwiping = false;
            card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease'; // Включаем CSS-переходы обратно
            card.classList.remove('swiping-left', 'swiping-right');

            const deltaX = currentX - startX;
            const swipeThreshold = card.offsetWidth * 0.25; // Порог свайпа 25% ширины карточки

            if (swipeStarted && Math.abs(deltaX) > swipeThreshold) { // Если был полноценный свайп
                if (deltaX > 0) { // Свайп вправо
                    const targetUrl = linkData.subscribeUrl || linkData.url; 
                    window.open(targetUrl, '_blank');
                    console.log(`[Gestures] Свайп вправо на ${strings[currentLang][linkData.label_key]}, открытие: ${targetUrl}`);
                } else { // Свайп влево
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
                        console.log(`[Gestures] Свайп влево на ${strings[currentLang][linkData.label_key]}, открытие: ${linkData.url}`);
                    }
                }
            }
            card.style.transform = 'translateX(0)'; // Сброс позиции карточки
        };

        // Привязываем слушатели событий: мышь для десктопа, тач для мобильных
        card.addEventListener('mousedown', handleStart);
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseup', handleEnd);
        card.addEventListener('mouseleave', handleEnd); 

        card.addEventListener('touchstart', (e) => { handleStart(e); }, { passive: false });
        card.addEventListener('touchmove', (e) => { handleMove(e); }, { passive: false });
        card.addEventListener('touchend', handleEnd);
    });
};


/**
 * Инициализирует и управляет кастомным 2D-просмотрщиком скина Minecraft на Canvas.
 * Позволяет вращать скин мышью или касаниями.
 */
const initMinecraftSkinViewer = () => {
    setVisibility(DOM.minecraftBlock, appConfig.showMinecraftSkinSection);
    if (appConfig.showMinecraftSkinSection) {
        if (!DOM.skinCanvas || !DOM.skinViewerContainer) {
            console.error("[SkinViewer] Отсутствуют необходимые DOM-элементы для просмотрщика скина. Инициализация невозможна.");
            return;
        }

        const ctx = DOM.skinCanvas.getContext('2d');
        let isDragging = false;
        let lastX = 0;

        // Загрузка изображения скина
        skinImage.onload = () => {
            skinImageLoaded = true;
            // Устанавливаем размеры canvas после загрузки изображения
            DOM.skinCanvas.width = DOM.skinViewerContainer.offsetWidth;
            DOM.skinCanvas.height = DOM.skinViewerContainer.offsetHeight;
            console.log("[SkinViewer] Изображение скина загружено и Canvas готов.");
            startSkinAnimationLoop(); // Запускаем цикл анимации
        };
        skinImage.onerror = () => {
            console.error("[SkinViewer] Ошибка загрузки изображения скина:", profileConfig.minecraftSkinUrl);
            skinImageLoaded = false;
        };
        skinImage.src = profileConfig.minecraftSkinUrl; // Устанавливаем источник изображения скина

        // Функция для рисования скина на Canvas
        const drawSkin = () => {
            if (!skinImageLoaded) return;

            ctx.clearRect(0, 0, DOM.skinCanvas.width, DOM.skinCanvas.height); // Очищаем Canvas

            // Вычисляем размеры и позицию для отображения скина
            const scale = Math.min(DOM.skinCanvas.width / 64, DOM.skinCanvas.height / 32); // Скин 64x32 пикселя
            const scaledWidth = 64 * scale * 2; // Увеличиваем размер для лучшей видимости
            const scaledHeight = 32 * scale * 2;
            
            // Центрируем скин на Canvas
            const centerX = DOM.skinCanvas.width / 2;
            const centerY = DOM.skinCanvas.height / 2;

            ctx.save(); // Сохраняем текущее состояние контекста
            ctx.translate(centerX, centerY); // Переносим начало координат в центр Canvas
            ctx.rotate(skinYaw); // Применяем поворот

            // Рисуем переднюю часть тела (8x8 пикселей)
            // Исходные координаты (x, y, width, height), Конечные координаты (x, y, width, height)
            // Голова (Face - перед)
            ctx.drawImage(skinImage, 8, 8, 8, 8, -scaledWidth / 8 / 2 * 3, -scaledHeight / 8 / 2 * 4, scaledWidth / 8 * 3, scaledHeight / 8 * 3);
            // Тело (Body - перед)
            ctx.drawImage(skinImage, 20, 20, 8, 12, -scaledWidth / 8, -scaledHeight / 8 / 2, scaledWidth / 4, scaledHeight / 2);
            // Правая рука (Right Arm - перед)
            ctx.drawImage(skinImage, 44, 20, 4, 12, scaledWidth / 8, -scaledHeight / 8 / 2, scaledWidth / 8, scaledHeight / 2);
            // Левая рука (Left Arm - перед) - часто зеркальная, но в скине может быть отдельная текстура
            ctx.drawImage(skinImage, 36, 52, 4, 12, -scaledWidth / 8 * 2, -scaledHeight / 8 / 2, scaledWidth / 8, scaledHeight / 2); // Обычно это вторая рука, если скин имеет тонкую модель
            // Правая нога (Right Leg - перед)
            ctx.drawImage(skinImage, 4, 20, 4, 12, -scaledWidth / 8, scaledHeight / 4, scaledWidth / 8, scaledHeight / 2);
            // Левая нога (Left Leg - перед)
            ctx.drawImage(skinImage, 20, 52, 4, 12, -scaledWidth / 8 * 2, scaledHeight / 4, scaledWidth / 8, scaledHeight / 2); // Обычно это вторая нога

            ctx.restore(); // Восстанавливаем состояние контекста
        };

        // Анимационный цикл
        const animateSkin = () => {
            drawSkin();
            skinAnimationFrameId = requestAnimationFrame(animateSkin);
        };

        const startSkinAnimationLoop = () => {
            if (skinAnimationFrameId) cancelAnimationFrame(skinAnimationFrameId);
            animateSkin();
        };

        // Обработчики событий для вращения скина мышью/касанием
        const handleStart = (e) => {
            isDragging = true;
            lastX = e.touches ? e.touches[0].clientX : e.clientX;
            DOM.skinCanvas.style.cursor = 'grabbing';
            if (skinAnimationFrameId) cancelAnimationFrame(skinAnimationFrameId); // Останавливаем авто-анимацию
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            const currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - lastX;
            skinYaw += deltaX * 0.01; // Увеличиваем/уменьшаем угол поворота
            lastX = currentX;
            drawSkin(); // Перерисовываем скин
        };

        const handleEnd = () => {
            isDragging = false;
            DOM.skinCanvas.style.cursor = 'grab';
            startSkinAnimationLoop(); // Возобновляем авто-анимацию
        };

        DOM.skinCanvas.addEventListener('mousedown', handleStart);
        DOM.skinCanvas.addEventListener('mousemove', handleMove);
        DOM.skinCanvas.addEventListener('mouseup', handleEnd);
        DOM.skinCanvas.addEventListener('mouseleave', handleEnd); // Важно для сброса, если мышь ушла

        DOM.skinCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart(e); }, { passive: false });
        DOM.skinCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
        DOM.skinCanvas.addEventListener('touchend', (e) => { e.preventDefault(); handleEnd(e); }, { passive: false });

        // Обработчик изменения размера контейнера Canvas для адаптивности
        new ResizeObserver(() => {
            if (DOM.skinViewerContainer && DOM.skinCanvas) {
                DOM.skinCanvas.width = DOM.skinViewerContainer.offsetWidth;
                DOM.skinCanvas.height = DOM.skinViewerContainer.offsetHeight;
                drawSkin(); // Перерисовываем после изменения размера
                console.log("[SkinViewer] Canvas изменен в размере и перерисован.");
            }
        }).observe(DOM.skinViewerContainer);

        console.log("[SkinViewer] Кастомный просмотрщик скина Minecraft инициализирован.");
    } else {
        // Если секция скина скрыта, очищаем ресурсы
        setVisibility(DOM.minecraftBlock, false);
        if (skinAnimationFrameId) cancelAnimationFrame(skinAnimationFrameId);
        skinImageLoaded = false;
        if (DOM.skinCanvas) {
            const ctx = DOM.skinCanvas.getContext('2d');
            ctx.clearRect(0, 0, DOM.skinCanvas.width, DOM.skinCanvas.height);
        }
        console.log("[SkinViewer] Кастомный просмотрщик скина Minecraft отключен и очищен.");
    }
};

/**
 * Запускает скачивание файла PNG-скина Minecraft.
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
        console.warn("[Download] URL скина Minecraft не задан. Скачивание невозможно.");
    }
};

/**
 * Настраивает видимость кнопки поддержки/доната и устанавливает её URL.
 */
const setupSupportButton = () => {
    setVisibility(DOM.supportSection, appConfig.showSupportButton);
    if (appConfig.showSupportButton) {
        if (DOM.supportButton) DOM.supportButton.href = appConfig.supportUrl;
        if (DOM.supportButtonText) DOM.supportButtonText.textContent = strings[currentLang].supportButton;
        console.log("[Render] Кнопка поддержки настроена.");
    }
};

/**
 * Рендерит содержимое страницы разработчика, отображая данные из appData.
 */
const renderDevPage = () => {
    if (DOM.devLastUpdated) DOM.devLastUpdated.textContent = appData.lastUpdated ? new Date(appData.lastUpdated).toLocaleString(currentLang) : 'N/A';
    if (DOM.devDataJsonContent) DOM.devDataJsonContent.textContent = JSON.stringify(appData, null, 2);
    if (DOM.devDebugInfoContent) DOM.devDebugInfoContent.textContent = JSON.stringify(appData.debugInfo || {}, null, 2);
    console.log("[Render] Страница разработчика отрисована.");
};

/**
 * Настраивает Google Analytics (в данный момент это заглушка).
 */
const setupAnalytics = () => {
    console.log("[Analytics] Настройка заглушки Google Analytics...");
    // Здесь можно интегрировать реальный код Google Analytics
};

/**
 * Показывает модальное окно предпросмотра ссылки с информацией из profileConfig.
 * @param {Object} linkData - Объект данных ссылки, для которой показывается предпросмотр.
 */
const showLinkPreview = (linkData) => {
    // Убедитесь, что DOM-элемент предпросмотра существует
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
    if (DOM.previewName) DOM.previewName.textContent = profileConfig.name;
    if (DOM.previewDescription) DOM.previewDescription.textContent = profileConfig.description;
    if (DOM.previewOpenLink) DOM.previewOpenLink.href = linkData.url; // Кнопка "Открыть ссылку" ведет на URL ссылки
    
    // Сохраняем ключ текущей ссылки в dataset модального окна для последующих проверок
    DOM.linkPreviewModal.dataset.currentLinkKey = linkData.label_key;

    setVisibility(DOM.linkPreviewModal, true); // Делаем модальное окно видимым
    DOM.linkPreviewModal.classList.add('active'); // Добавляем класс 'active' для применения стилей/анимаций

    // Добавляем слушатели для закрытия модального окна
    if (DOM.previewCloseButton) DOM.previewCloseButton.onclick = hideLinkPreview;
    
    // Добавляем слушатели для открытия ссылки при клике на элементах внутри предпросмотра
    // Используем e.preventDefault(), чтобы не было дублирования открытия, если элемент является ссылкой.
    if (DOM.previewAvatar) DOM.previewAvatar.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewName) DOM.previewName.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewDescription) DOM.previewDescription.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };

    console.log(`[Preview] Показан предпросмотр ссылки для: ${strings[currentLang][linkData.label_key]}`);
};

/**
 * Скрывает модальное окно предпросмотра ссылки с небольшой задержкой.
 */
const hideLinkPreview = () => {
    // Добавляем небольшую задержку, чтобы предотвратить моргание при быстром движении курсора
    DOM.linkPreviewModal._hideTimeout = setTimeout(() => {
        setVisibility(DOM.linkPreviewModal, false);
        DOM.linkPreviewModal.classList.remove('active'); // Удаляем класс 'active'
        DOM.linkPreviewModal.dataset.currentLinkKey = ''; // Очищаем ключ текущей ссылки
        // Очищаем слушатели, чтобы избежать утечек памяти и нежелательных срабатываний
        if (DOM.previewCloseButton) DOM.previewCloseButton.onclick = null;
        if (DOM.previewAvatar) DOM.previewAvatar.onclick = null;
        if (DOM.previewName) DOM.previewName.onclick = null;
        if (DOM.previewDescription) DOM.previewDescription.onclick = null;
        console.log("[Preview] Предпросмотр ссылки скрыт.");
    }, 100); // Задержка 100 мс
};


// --- Инициализация приложения после полной загрузки DOM ---
// 'DOMContentLoaded' срабатывает, когда HTML-документ полностью загружен и разобран,
// но без ожидания загрузки стилей, изображений и подфреймов. 
// Атрибут 'defer' у скрипта гарантирует, что он выполнится после парсинга DOM.
document.addEventListener('DOMContentLoaded', async () => {
    console.log("------------------------------------------");
    console.log("DOMContentLoaded: Запуск инициализации приложения Personal Link Aggregator.");

    // 1. Загрузка данных приложения (data.json или кэш)
    appData = await fetchAppData();
    console.log("[Init] Данные приложения загружены:", appData);

    // 2. Рендеринг секции профиля
    renderProfileSection();

    // 3. Применение начальной темы и языка
    // Эта функция также вызовет renderLinksSection и calculateAndDisplayTotalFollowers
    applyTheme(currentTheme);
    updateLanguage(); 

    // 4. Настройка переключателя темы
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
            console.log(`[Event] Тема переключена на: ${currentTheme}`);
        });
        console.log("[Init] Переключатель темы настроен.");
    } else {
        console.warn("[Init] Элемент переключателя темы не найден.");
    }

    // 5. Настройка переключателя языка
    if (DOM.languageToggle) {
        DOM.languageToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ru' : 'en';
            localStorage.setItem('lang', currentLang);
            updateLanguage(); // Обновить весь текст UI
            console.log(`[Event] Язык переключен на: ${currentLang}`);
        });
        console.log("[Init] Переключатель языка настроен.");
    } else {
        console.warn("[Init] Элемент переключателя языка не найден.");
    }

    // 6. Настройка режима разработчика
    if (appConfig.developmentMode && DOM.devToggle) {
        setVisibility(DOM.devToggle, true); // Показать кнопку Dev
        if (DOM.devToggle) {
            DOM.devToggle.addEventListener('click', () => {
                window.location.hash = (window.location.hash === '#/dev') ? '' : '#/dev';
                console.log(`[Event] Кнопка Dev нажата. Новый хэш: ${window.location.hash}`);
            });
        }
        if (DOM.backToMainButton) {
            DOM.backToMainButton.addEventListener('click', () => {
                window.location.hash = ''; // Вернуться на главную
                console.log("[Event] Кнопка 'Назад к сайту' нажата.");
            });
        }
        console.log("[Init] Режим разработчика настроен.");
    } else {
        setVisibility(DOM.devToggle, false); // Скрыть кнопку Dev
        console.log("[Init] Режим разработчика отключен или кнопка не найдена.");
    }
    handleHashChange(); // Проверить хэш URL при загрузке для установки начального вида

    // 7. Инициализация Minecraft Skin Viewer
    // Поскольку мы используем кастомную реализацию, внешних библиотек ждать не нужно.
    initMinecraftSkinViewer();
    if (DOM.downloadSkinButton) DOM.downloadSkinButton.addEventListener('click', downloadMinecraftSkin);
    console.log("[Init] Просмотрщик скина Minecraft настроен.");

    // 8. Настройка кнопки поддержки
    setupSupportButton();
    console.log("[Init] Кнопка поддержки настроена.");

    // 9. Рендеринг видео YouTube (использует appData, полученные ранее)
    renderYouTubeVideosSection();
    console.log("[Init] Секция видео YouTube настроена.");

    // 10. Отображение живых стримов (использует appData, полученные ранее)
    displayLiveStreamSection();
    console.log("[Init] Секция Live Stream настроена.");

    // 11. Управление модальным окном первого посещения
    manageFirstVisitModal();
    console.log("[Init] Модальное окно первого посещения настроено.");
    
    // 12. Настройка аналитики (заглушка)
    setupAnalytics();
    console.log("[Init] Аналитика настроена.");

    // Слушатель для изменения хэша URL для переключения видов
    window.addEventListener('hashchange', handleHashChange);
    console.log("[Init] Слушатель изменения хэша URL добавлен.");

    console.log("Инициализация Personal Link Aggregator завершена.");
    console.log("------------------------------------------");
});
