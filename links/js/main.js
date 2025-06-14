// links/js/main.js
// Основной JavaScript-файл для Personal Link Aggregator
// ПЕРЕПИСАННЫЙ КОД - v10

// Импортируем конфигурационные данные и текстовые строки из отдельных файлов
import { appConfig, profileConfig, linksConfig } from './config.js';
import { strings } from './strings.js';

// --- DOM Element References ---
// Все ссылки на DOM-элементы собираем здесь для удобства и избежания повторных запросов
const DOM = {
    // App sections
    appContainer: document.getElementById('app'),
    mainView: document.getElementById('main-view'),
    devView: document.getElementById('dev-view'),
    offlineWarning: document.getElementById('offline-warning'),
    offlineMessage: document.getElementById('offline-message'),

    // Live Stream Section
    liveStreamSection: document.getElementById('live-stream-section'),
    liveEmbed: document.getElementById('live-embed'),
    twitchNotification: document.getElementById('twitch-notification'),
    twitchMessage: document.getElementById('twitch-message'),
    twitchLink: document.getElementById('twitch-link'),
    twitchLinkText: document.getElementById('twitch-link-text'),

    // Profile Section
    profileSection: document.getElementById('profile-section'),
    avatar: document.getElementById('avatar'),
    profileName: document.getElementById('profile-name'),
    profileDescription: document.getElementById('profile-description'),
    totalFollowers: document.getElementById('total-followers'),

    // Links Section
    linksSection: document.getElementById('links-section'),
    
    // Support Section
    supportSection: document.getElementById('support-section'),
    supportButton: document.getElementById('support-button'),
    supportButtonText: document.getElementById('support-button-text'),

    // Minecraft Skin Viewer Section
    minecraftBlock: document.getElementById('minecraft-block'), // Использовать ID
    minecraftTitle: document.getElementById('minecraft-title'),
    skinViewerContainer: document.getElementById('skin-viewer-container'),
    skinCanvas: document.getElementById('skin-canvas'),
    downloadSkinButton: document.getElementById('download-skin-button'),
    downloadSkinText: document.getElementById('download-skin-text'),

    // YouTube Videos Section
    youtubeVideosSection: document.getElementById('youtube-videos-section'),
    recentVideosTitle: document.getElementById('recent-videos-title'),
    videoCarousel: document.getElementById('video-carousel'),

    // Global Controls
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    languageToggle: document.getElementById('language-toggle'),
    devToggle: document.getElementById('dev-toggle'),
    backToMainButton: document.getElementById('back-to-main-button'),
    devTitle: document.getElementById('dev-title'),
    devLastUpdatedLabel: document.getElementById('dev-last-updated-label'),
    devLastUpdated: document.getElementById('dev-last-updated'),
    devDataJsonContentLabel: document.getElementById('dev-data-json-content-label'),
    devDataJsonContent: document.getElementById('dev-data-json-content'),
    devDebugInfoContentLabel: document.getElementById('dev-debug-info-content-label'),
    devDebugInfoContent: document.getElementById('dev-debug-info-content'),
    backToMainText: document.getElementById('back-to-main-text'),

    // First Visit Modal
    firstVisitModal: document.getElementById('first-visit-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalDescription: document.getElementById('modal-description'),
    modalCloseBtn: document.getElementById('modal-close'),

    // NEW: Link Preview Modal
    linkPreviewModal: document.getElementById('link-preview-modal'),
    previewAvatar: document.getElementById('preview-avatar'),
    previewName: document.getElementById('preview-name'),
    previewDescription: document.getElementById('preview-description'),
    previewOpenLink: document.getElementById('preview-open-link'),
    previewCloseButton: document.getElementById('preview-close-button'),
};

// --- Application State ---
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ru') ? 'ru' : 'en');
let skinViewer = null; // Minecraft Skin Viewer instance
let appData = {}; // Data fetched from data.json

// --- Helper Functions ---

/**
 * Управляет видимостью DOM-элемента, добавляя или удаляя класс 'hidden'.
 * @param {HTMLElement} element - DOM-элемент.
 * @param {boolean} isVisible - Если true, элемент виден (скрытый класс удален).
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
 * Переключает отображение основного вида и вида разработчика.
 * @param {string} view - 'main' или 'dev'.
 */
const renderView = (view) => {
    setVisibility(DOM.mainView, view === 'main');
    setVisibility(DOM.devView, view === 'dev');
    if (view === 'dev') {
        renderDevPage();
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
 * Применяет выбранную тему (темную или светлую) к телу документа.
 * @param {string} theme - 'dark' или 'light'.
 */
const applyTheme = (theme) => {
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
    DOM.themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    DOM.themeToggle.setAttribute('aria-label', strings[currentLang][`theme${theme === 'dark' ? 'Light' : 'Dark'}`]);
    console.log(`[Theme] Applied theme: ${theme}`);
};

/**
 * Обновляет весь динамический текстовый контент в пользовательском интерфейсе
 * на основе текущего языка.
 */
const updateLanguage = () => {
    console.log(`[Language] Updating UI for language: ${currentLang}`);
    if (DOM.recentVideosTitle) DOM.recentVideosTitle.textContent = strings[currentLang].recentVideosTitle;
    if (DOM.minecraftTitle) DOM.minecraftTitle.textContent = strings[currentLang].minecraftTitle;
    if (DOM.downloadSkinText) DOM.downloadSkinText.textContent = strings[currentLang].downloadSkin;
    if (DOM.supportButtonText) DOM.supportButtonText.textContent = strings[currentLang].supportButton;
    if (DOM.offlineMessage) DOM.offlineMessage.textContent = strings[currentLang].offlineMessage;
    if (DOM.twitchLinkText) DOM.twitchLinkText.textContent = strings[currentLang].watchOnTwitch;

    if (DOM.modalTitle) DOM.modalTitle.textContent = strings[currentLang].modalTitle;
    if (DOM.modalDescription) DOM.modalDescription.textContent = strings[currentLang].modalDescription;
    if (DOM.modalCloseBtn) DOM.modalCloseBtn.textContent = strings[currentLang].gotItButton;

    if (DOM.devTitle) DOM.devTitle.textContent = strings[currentLang].devPageTitle;
    if (DOM.devLastUpdatedLabel) DOM.devLastUpdatedLabel.textContent = strings[currentLang].devLastUpdatedLabel;
    if (DOM.devDataJsonContentLabel) DOM.devDataJsonContentLabel.textContent = strings[currentLang].devDataJsonContentLabel;
    if (DOM.devDebugInfoContentLabel) DOM.devDebugInfoContentLabel.textContent = strings[currentLang].devDebugInfoContentLabel;
    if (DOM.backToMainText) DOM.backToMainText.textContent = strings[currentLang].backToMainText;

    // После обновления языка, перерендерим компоненты, которые используют строки
    renderLinks(linksConfig);
    calculateAndDisplayTotalFollowers();
    applyTheme(currentTheme); // Обновить атрибут aria-label для кнопки темы
};

/**
 * Форматирует число в удобочитаемую строку.
 * @param {number} num - Число для форматирования.
 * @returns {string} Отформатированная строка.
 */
const formatCount = (num) => {
    if (num === null || isNaN(num)) return strings[currentLang].loading;
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

/**
 * Вычисляет и отображает общее количество подписчиков.
 */
const calculateAndDisplayTotalFollowers = () => {
    let total = 0;
    let allCountsAvailable = true;
    const sourceCounts = appData.followerCounts || {};

    for (const link of linksConfig) {
        if (link.isSocial && link.showSubscriberCount && link.active) {
            const count = sourceCounts[link.platformId];
            if (typeof count === 'number') {
                total += count;
            } else {
                const cachedCount = localStorage.getItem(`follower_count_${link.platformId}`);
                if (cachedCount && !isNaN(parseInt(cachedCount))) {
                    total += parseInt(cachedCount);
                } else {
                    allCountsAvailable = false;
                }
            }
        }
    }

    if (DOM.profileSection && appConfig.showProfileSection) {
        if (allCountsAvailable) {
            DOM.totalFollowers.textContent = `${strings[currentLang].totalFollowers}${formatCount(total)}`;
        } else {
            DOM.totalFollowers.textContent = `${strings[currentLang].totalFollowers}${strings[currentLang].loading}`;
        }
    }
};

/**
 * Получает данные из data.json (или из локального хранилища, если есть кэш).
 * @returns {Promise<Object>} Объект данных.
 */
const fetchAppData = async () => {
    const cacheKey = 'app_data_cache';
    const cachedData = localStorage.getItem(cacheKey);

    if (!navigator.onLine) {
        setVisibility(DOM.offlineWarning, true);
        if (cachedData) {
            console.warn("[Data Fetch] Offline, using cached data.");
            try { return JSON.parse(cachedData); } catch { return {}; }
        } else {
            console.error("[Data Fetch] Offline and no cache available.");
            return {};
        }
    } else {
        setVisibility(DOM.offlineWarning, false);
    }

    try {
        console.log("[Data Fetch] Fetching new data from data.json...");
        const response = await fetch(`${appConfig.dataUrl}?t=${Date.now()}`); // Cache-busting
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        console.log("[Data Fetch] Data fetched successfully.");
        return data;
    } catch (error) {
        console.error("Error fetching app data:", error);
        if (cachedData) {
            console.warn("[Data Fetch] Error fetching new data, using cached data.");
            try { return JSON.parse(cachedData); } catch { return {}; }
        }
        return {};
    }
};

/**
 * Рендерит секцию профиля.
 */
const renderProfileSection = () => {
    setVisibility(DOM.profileSection, appConfig.showProfileSection);
    if (appConfig.showProfileSection) {
        if (DOM.avatar) DOM.avatar.src = profileConfig.avatar;
        if (DOM.profileName) DOM.profileName.textContent = profileConfig.name;
        if (DOM.profileDescription) DOM.profileDescription.textContent = profileConfig.description;
        console.log("[Render] Profile section rendered.");
    }
};

/**
 * Рендерит карточки ссылок.
 * @param {Array<Object>} links - Массив объектов ссылок.
 */
const renderLinksSection = (links) => {
    setVisibility(DOM.linksSection, appConfig.showLinksSection);
    if (appConfig.showLinksSection) {
        DOM.linksSection.innerHTML = ''; // Очищаем перед рендерингом
        const sortedLinks = links.filter(link => link.active).sort((a, b) => a.order - b.order); // Фильтруем по 'active'

        sortedLinks.forEach(link => {
            const card = document.createElement('a');
            // Важно: href для самой карточки - это основная ссылка, а не subscribeUrl для дефолтного клика
            card.href = link.url; 
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.className = `card relative flex items-center justify-between p-4 rounded-2xl m3-shadow-md ${link.isSocial ? 'swipe-target' : ''} cursor-pointer`; // Добавляем cursor-pointer
            card.setAttribute('data-link-id', link.label_key); // Используем label_key как ID
            card.setAttribute('data-platform-id', link.platformId || '');
            
            // NEW: Добавление слушателей для предпросмотра
            card.addEventListener('mouseenter', (e) => showLinkPreview(e, link));
            card.addEventListener('mouseleave', hideLinkPreview);
            // Для мобильных устройств: tap to show preview, second tap to open link
            card.addEventListener('click', (e) => {
                // Предотвращаем дефолтное действие, чтобы сначала показать превью
                e.preventDefault(); 
                showLinkPreview(e, link);
            });


            let iconHtml = '';
            if (link.icon) {
                const simpleIcon = window.SimpleIcons && window.SimpleIcons.get(link.icon);
                if (simpleIcon) {
                    iconHtml = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="si-icon" style="fill:#${simpleIcon.hex || 'currentColor'};"><title>${strings[currentLang][link.label_key] || link.label_key}</title><path d="${simpleIcon.path}"/></svg>`;
                } else {
                    iconHtml = `<span class="material-symbols-outlined text-2xl mr-4">${link.icon}</span>`;
                    console.warn(`Simple Icon '${link.icon}' not found or SimpleIcons library not loaded, falling back to Material Symbols.`);
                }
            }

            let followerCountHtml = '';
            if (link.isSocial && link.showSubscriberCount) {
                const count = appData.followerCounts ? appData.followerCounts[link.platformId] : undefined;
                followerCountHtml = `<span class="text-sm text-gray-400 mr-2 follower-count-display">${formatCount(count)}</span>`;
                if (typeof count === 'number') {
                    localStorage.setItem(`follower_count_${link.platformId}`, count.toString());
                }
            }

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
        console.log("[Render] Links section rendered.");
        initSwipeGestures(); // Инициализируем жесты после рендеринга ссылок
    }
};

/**
 * Рендерит последние видео YouTube.
 */
const renderYouTubeVideosSection = () => {
    const videos = appData.youtubeVideos || [];
    setVisibility(DOM.youtubeVideosSection, appConfig.showYouTubeVideosSection && videos.length > 0);

    if (appConfig.showYouTubeVideosSection && videos.length > 0) {
        DOM.videoCarousel.innerHTML = '';
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
            DOM.videoCarousel.appendChild(videoCard);
        });
        console.log("[Render] YouTube videos section rendered.");
    }
};

/**
 * Отображает встроенный плеер прямой трансляции и/или уведомление Twitch.
 */
const displayLiveStreamSection = () => {
    const streamInfo = appData.liveStream || { type: 'none' };
    setVisibility(DOM.liveStreamSection, appConfig.showLiveStreamSection);

    if (appConfig.showLiveStreamSection) {
        DOM.liveEmbed.src = ''; // Очищаем src на случай, если стрим закончился
        setVisibility(DOM.twitchNotification, false); // Скрываем по умолчанию

        if (streamInfo.type === 'youtube' && streamInfo.id) {
            DOM.liveEmbed.src = `https://www.youtube.com/embed/${streamInfo.id}?autoplay=1&mute=0&controls=1`;
            setVisibility(DOM.liveStreamSection, true);
            if (streamInfo.twitchLive && streamInfo.twitchLive.twitchChannelName) {
                DOM.twitchMessage.textContent = `${streamInfo.twitchLive.title} также в эфире на Twitch!`;
                DOM.twitchLink.href = `https://www.twitch.tv/${streamInfo.twitchLive.twitchChannelName}`;
                setVisibility(DOM.twitchNotification, true);
            }
            console.log("[Render] YouTube Live Stream active.");
        } else if (streamInfo.type === 'twitch' && streamInfo.twitchChannelName) {
            DOM.liveEmbed.src = `https://player.twitch.tv/?channel=${streamInfo.twitchChannelName}&parent=${window.location.hostname}&autoplay=true&mute=false`;
            setVisibility(DOM.liveStreamSection, true);
            console.log("[Render] Twitch Live Stream active.");
        } else {
            setVisibility(DOM.liveStreamSection, false); // Скрыть секцию, если нет активного стрима
            console.log("[Render] No active live stream.");
        }
    }
};

/**
 * Управляет модальным окном первого посещения.
 */
const manageFirstVisitModal = () => {
    const hasVisited = localStorage.getItem('visited_modal');
    if (!hasVisited) {
        setVisibility(DOM.firstVisitModal, true);
        DOM.modalCloseBtn.onclick = () => {
            setVisibility(DOM.firstVisitModal, false);
            localStorage.setItem('visited_modal', 'true');
        };
        console.log("[Modal] First visit modal shown.");
    } else {
        setVisibility(DOM.firstVisitModal, false);
        console.log("[Modal] First visit modal not shown (already visited).");
    }
};

/**
 * Инициализирует swipe-жесты для элементов с классом 'swipe-target'.
 */
const initSwipeGestures = () => {
    // Удаляем предыдущие слушатели, чтобы избежать дублирования после ререндера
    document.querySelectorAll('.swipe-target').forEach(card => {
        card.removeEventListener('mousedown', card._handleSwipeStart);
        card.removeEventListener('mousemove', card._handleSwipeMove);
        card.removeEventListener('mouseup', card._handleSwipeEnd);
        card.removeEventListener('mouseleave', card._handleSwipeEnd);
        card.removeEventListener('touchstart', card._handleSwipeStart);
        card.removeEventListener('touchmove', card._handleSwipeMove);
        card.removeEventListener('touchend', card._handleSwipeEnd);
        // Также удаляем click-listener, который мы добавили для предпросмотра
        card.removeEventListener('click', card._handleClickForPreview);
    });

    const swipeTargets = document.querySelectorAll('.swipe-target');
    console.log(`[Gestures] Initializing swipe gestures for ${swipeTargets.length} elements.`);
    swipeTargets.forEach(card => {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;
        let swipeStarted = false; // Флаг для отслеживания начала свайпа

        const linkData = linksConfig.find(link => link.label_key === card.getAttribute('data-link-id'));
        if (!linkData) {
            console.warn(`[Gestures] No link data found for card with label_key: ${card.getAttribute('data-link-id')}`);
            return;
        }

        const handleStart = (e) => {
            isSwiping = true;
            swipeStarted = false; // Сброс флага
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            card.style.transition = 'none'; // Отключаем CSS-переход во время активного свайпа
            console.log(`[Gestures] Swipe start on ${linkData.label_key}`);
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
            const swipeThreshold = card.offsetWidth * 0.25;

            if (swipeStarted && Math.abs(deltaX) > swipeThreshold) { // Проверяем, был ли полноценный свайп
                if (deltaX > 0) { // Свайп вправо
                    const targetUrl = linkData.subscribeUrl || linkData.url; // Используем subscribeUrl если есть
                    window.open(targetUrl, '_blank');
                    console.log(`[Gestures] Swiped right on ${strings[currentLang][linkData.label_key]}, opening: ${targetUrl}`);
                } else { // Свайп влево
                    if (linkData.platformId === 'youtube') {
                        const liveStream = appData.liveStream;
                        if (liveStream && liveStream.type === 'youtube' && liveStream.id) {
                            window.open(`https://www.youtube.com/watch?v=${liveStream.id}`, '_blank');
                            console.log(`[Gestures] Swiped left on YouTube, opening live stream: ${liveStream.id}`);
                        } else if (appData.youtubeVideos && appData.youtubeVideos.length > 0) {
                            window.open(`https://www.youtube.com/watch?v=${appData.youtubeVideos[0].id}`, '_blank');
                            console.log(`[Gestures] Swiped left on YouTube, opening latest video: ${appData.youtubeVideos[0].id}`);
                        } else {
                            window.open(linkData.url, '_blank');
                            console.log(`[Gestures] Swiped left on YouTube, no videos/streams, opening channel: ${linkData.url}`);
                        }
                    } else {
                        window.open(linkData.url, '_blank');
                        console.log(`[Gestures] Swiped left on ${strings[currentLang][linkData.label_key]}, opening: ${linkData.url}`);
                    }
                }
            }
            card.style.transform = 'translateX(0)'; // Сброс позиции карточки
        };

        // Сохраняем ссылки на функции для их последующего удаления при ререндере
        card._handleSwipeStart = handleStart;
        card._handleSwipeMove = handleMove;
        card._handleSwipeEnd = handleEnd;
        card._handleClickForPreview = (e) => {
            // Если свайп не начинался, значит это был обычный клик/тап
            if (!swipeStarted) {
                // Если предпросмотр уже открыт для этой ссылки, то открыть ссылку
                // Иначе, показать предпросмотр
                if (DOM.linkPreviewModal.classList.contains('active') && DOM.previewOpenLink.href === linkData.url) {
                    window.open(linkData.url, '_blank');
                    hideLinkPreview();
                } else {
                    e.preventDefault(); // Предотвращаем стандартное действие ссылки
                    showLinkPreview(e, linkData);
                }
            }
        };

        // События мыши для десктопа
        card.addEventListener('mousedown', card._handleSwipeStart);
        card.addEventListener('mousemove', card._handleSwipeMove);
        card.addEventListener('mouseup', card._handleSwipeEnd);
        card.addEventListener('mouseleave', card._handleSwipeEnd);

        // Сенсорные события для мобильных устройств
        card.addEventListener('touchstart', (e) => { card._handleSwipeStart(e); }, { passive: false });
        card.addEventListener('touchmove', (e) => { card._handleSwipeMove(e); }, { passive: false });
        card.addEventListener('touchend', (e) => { card._handleSwipeEnd(e); }, { passive: false });

        // Добавляем click-listener для показа предпросмотра (для мобильных или для обычных кликов)
        // Этот слушатель должен быть последним, чтобы он срабатывал после свайпов
        card.addEventListener('click', card._handleClickForPreview);
    });
};

/**
 * Инициализирует 3D-просмотрщик скина Minecraft.
 */
const initMinecraftSkinViewer = () => {
    setVisibility(DOM.minecraftBlock, appConfig.showMinecraftSkinSection);
    if (appConfig.showMinecraftSkinSection) {
        if (!DOM.skinCanvas) {
            console.error("[SkinViewer] Canvas element #skin-canvas not found.");
            return;
        }
        if (!DOM.skinViewerContainer) {
            console.error("[SkinViewer] Skin viewer container #skin-viewer-container not found.");
            return;
        }

        // Убедимся, что skinview3d загружен, прежде чем пытаться его использовать
        if (typeof skinview3d === 'undefined' || !skinview3d.SkinViewer) {
            console.error("[SkinViewer] skinview3d library not loaded.");
            // Попробуем загрузить его динамически, если не загружен (крайний случай)
            const script = document.createElement('script');
            script.src = "https://unpkg.com/skinview3d@2.0.7/bundle/skinview3d.min.js";
            script.onload = () => initMinecraftSkinViewer(); // Повторная попытка после загрузки
            document.head.appendChild(script);
            return;
        }

        if (skinViewer) {
            skinViewer.dispose(); // Очищаем предыдущий экземпляр, если он был
            skinViewer = null;
        }

        try {
            skinViewer = new skinview3d.SkinViewer({
                canvas: DOM.skinCanvas,
                width: DOM.skinViewerContainer.offsetWidth,
                height: DOM.skinViewerContainer.offsetHeight,
                skin: profileConfig.minecraftSkinUrl
            });
            skinViewer.animation = new skinview3d.WalkingAnimation();
            console.log("[SkinViewer] Minecraft Skin Viewer initialized.");

            let isDragging = false;
            let previousMouseX = 0;
            let previousMouseY = 0;

            const mouseOrTouchStart = (e) => {
                isDragging = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                previousMouseX = clientX;
                previousMouseY = clientY;
                if (!e.touches) DOM.skinCanvas.style.cursor = 'grabbing';
            };

            const mouseOrTouchMove = (e) => {
                if (!isDragging) return;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const deltaX = clientX - previousMouseX;
                const deltaY = clientY - previousMouseY;

                skinViewer.yaw += deltaX * 0.01;
                skinViewer.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, skinViewer.pitch - deltaY * 0.01));

                previousMouseX = clientX;
                previousMouseY = clientY;
            };

            const mouseOrTouchEnd = () => {
                isDragging = false;
                DOM.skinCanvas.style.cursor = 'grab';
            };

            DOM.skinCanvas.addEventListener('mousedown', mouseOrTouchStart);
            DOM.skinCanvas.addEventListener('mousemove', mouseOrTouchMove);
            DOM.skinCanvas.addEventListener('mouseup', mouseOrTouchEnd);
            DOM.skinCanvas.addEventListener('mouseleave', mouseOrTouchEnd);

            DOM.skinCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); mouseOrTouchStart(e); }, { passive: false });
            DOM.skinCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); mouseOrTouchMove(e); }, { passive: false });
            DOM.skinCanvas.addEventListener('touchend', (e) => { e.preventDefault(); mouseOrTouchEnd(e); }, { passive: false });


            new ResizeObserver(() => {
                if (DOM.skinViewerContainer && skinViewer) {
                    skinViewer.setSize(DOM.skinViewerContainer.offsetWidth, DOM.skinViewerContainer.offsetHeight);
                    console.log("[SkinViewer] Resized.");
                }
            }).observe(DOM.skinViewerContainer);

        } catch (error) {
            console.error("[SkinViewer] Error initializing Minecraft Skin Viewer:", error);
        }
    } else {
        setVisibility(DOM.minecraftBlock, false);
        if (skinViewer) {
            skinViewer.dispose();
            skinViewer = null;
            console.log("[SkinViewer] Minecraft Skin Viewer disposed.");
        }
    }
};

/**
 * Запускает скачивание файла PNG-скина Minecraft.
 */
const downloadMinecraftSkin = () => {
    if (profileConfig.minecraftSkinUrl) {
        const a = document.createElement('a');
        a.href = profileConfig.minecraftSkinUrl;
        a.download = 'minecraft_skin.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("[Download] Attempting to download Minecraft skin.");
    } else {
        console.warn("[Download] URL скина Minecraft не задан.");
    }
};

/**
 * Настраивает видимость кнопки поддержки.
 */
const setupSupportButton = () => {
    setVisibility(DOM.supportSection, appConfig.showSupportButton);
    if (appConfig.showSupportButton) {
        if (DOM.supportButton) DOM.supportButton.href = appConfig.supportUrl;
        if (DOM.supportButtonText) DOM.supportButtonText.textContent = strings[currentLang].supportButton;
        console.log("[Render] Support button set up.");
    }
};

/**
 * Рендерит содержимое страницы разработчика.
 */
const renderDevPage = () => {
    if (DOM.devLastUpdated) DOM.devLastUpdated.textContent = appData.lastUpdated ? new Date(appData.lastUpdated).toLocaleString(currentLang) : 'N/A';
    if (DOM.devDataJsonContent) DOM.devDataJsonContent.textContent = JSON.stringify(appData, null, 2);
    if (DOM.devDebugInfoContent) DOM.devDebugInfoContent.textContent = JSON.stringify(appData.debugInfo || {}, null, 2);
    console.log("[Render] Developer page rendered.");
};

/**
 * Настраивает Google Analytics (заглушка).
 */
const setupAnalytics = () => {
    console.log("[Analytics] Setting up Google Analytics placeholder...");
    // Здесь можно интегрировать реальный код Google Analytics
};

/**
 * Показывает модальное окно предпросмотра ссылки.
 * @param {Event} e - Событие, вызвавшее предпросмотр (например, mouseenter или click).
 * @param {Object} linkData - Объект данных ссылки.
 */
const showLinkPreview = (e, linkData) => {
    // Останавливаем скрытие, если оно было запланировано mouseleave
    clearTimeout(DOM.linkPreviewModal._hideTimeout);

    // Если предпросмотр уже открыт для этой ссылки, не открываем его снова
    if (DOM.linkPreviewModal.classList.contains('active') && DOM.previewOpenLink.href === linkData.url) {
        return;
    }

    if (DOM.previewAvatar) DOM.previewAvatar.src = profileConfig.avatar;
    if (DOM.previewName) DOM.previewName.textContent = profileConfig.name;
    if (DOM.previewDescription) DOM.previewDescription.textContent = profileConfig.description;
    if (DOM.previewOpenLink) DOM.previewOpenLink.href = linkData.url;

    setVisibility(DOM.linkPreviewModal, true);
    DOM.linkPreviewModal.classList.add('active'); // Добавляем класс 'active' для стилей/анимаций

    // Добавляем слушатель для закрытия по кнопке
    DOM.previewCloseButton.onclick = hideLinkPreview;
    
    // Добавляем слушатель для открытия ссылки при клике на аватаре/имени/описании в предпросмотре
    if (DOM.previewAvatar) DOM.previewAvatar.onclick = () => window.open(linkData.url, '_blank');
    if (DOM.previewName) DOM.previewName.onclick = () => window.open(linkData.url, '_blank');
    if (DOM.previewDescription) DOM.previewDescription.onclick = () => window.open(linkData.url, '_blank');

    console.log(`[Preview] Showing link preview for: ${strings[currentLang][linkData.label_key]}`);
};

/**
 * Скрывает модальное окно предпросмотра ссылки.
 */
const hideLinkPreview = () => {
    // Добавляем небольшую задержку для mouseleave, чтобы избежать мгновенного скрытия
    // если курсор ненадолго соскочил с элемента.
    DOM.linkPreviewModal._hideTimeout = setTimeout(() => {
        setVisibility(DOM.linkPreviewModal, false);
        DOM.linkPreviewModal.classList.remove('active');
        // Очищаем слушатель, чтобы избежать утечек памяти
        DOM.previewCloseButton.onclick = null;
        if (DOM.previewAvatar) DOM.previewAvatar.onclick = null;
        if (DOM.previewName) DOM.previewName.onclick = null;
        if (DOM.previewDescription) DOM.previewDescription.onclick = null;
        console.log("[Preview] Hiding link preview.");
    }, 100); // 100ms задержки
};

// --- Initial Load and Event Listeners Setup ---

// Используем DOMContentLoaded для более ранней инициализации,
// так как <script type="module" defer> гарантирует, что DOM уже загружен.
document.addEventListener('DOMContentLoaded', async () => {
    console.log("------------------------------------------");
    console.log("DOMContentLoaded fired. Initializing Personal Link Aggregator.");

    // 1. Fetch initial app data (from data.json or cache)
    appData = await fetchAppData();
    console.log("[Init] App Data loaded:", appData);

    // 2. Render Profile (visibility controlled by appConfig)
    renderProfileSection();

    // 3. Apply initial theme and language
    applyTheme(currentTheme);
    updateLanguage(); // This call will now also trigger renderLinksSection and calculateAndDisplayTotalFollowers

    // 4. Set up Theme Toggle
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
            console.log(`[Event] Theme toggled to: ${currentTheme}`);
        });
        console.log("[Init] Theme Toggle configured.");
    } else {
        console.warn("[Init] Theme Toggle element not found.");
    }

    // 5. Set up Language Toggle
    if (DOM.languageToggle) {
        DOM.languageToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ru' : 'en';
            localStorage.setItem('lang', currentLang);
            updateLanguage();
            console.log(`[Event] Language toggled to: ${currentLang}`);
        });
        console.log("[Init] Language Toggle configured.");
    } else {
        console.warn("[Init] Language Toggle element not found.");
    }


    // 6. Setup Developer Mode Toggle
    if (appConfig.developmentMode && DOM.devToggle) {
        setVisibility(DOM.devToggle, true);
        DOM.devToggle.addEventListener('click', () => {
            window.location.hash = (window.location.hash === '#/dev') ? '' : '#/dev';
            console.log(`[Event] Dev toggle clicked. New hash: ${window.location.hash}`);
        });
        if (DOM.backToMainButton) {
            DOM.backToMainButton.addEventListener('click', () => {
                window.location.hash = '';
                console.log("[Event] Back to main button clicked.");
            });
        }
        console.log("[Init] Developer Mode Toggle configured.");
    } else {
        setVisibility(DOM.devToggle, false);
        console.log("[Init] Developer Mode is disabled or toggle not found.");
    }
    handleHashChange(); // Check URL hash on load to set initial view

    // 7. Initialize Minecraft Skin Viewer (visibility controlled by appConfig)
    initMinecraftSkinViewer();
    if (DOM.downloadSkinButton) DOM.downloadSkinButton.addEventListener('click', downloadMinecraftSkin);
    console.log("[Init] Minecraft Skin Viewer configured.");

    // 8. Setup Support Button (visibility controlled by appConfig)
    setupSupportButton();
    console.log("[Init] Support Button configured.");

    // 9. Render YouTube Videos (visibility controlled by appConfig)
    renderYouTubeVideosSection();
    console.log("[Init] YouTube Videos section configured.");

    // 10. Display Live Streams (visibility controlled by appConfig)
    displayLiveStreamSection();
    console.log("[Init] Live Stream section configured.");

    // 11. Manage First Visit Modal
    manageFirstVisitModal();
    console.log("[Init] First Visit Modal configured.");

    // Listen for hash changes to switch views
    window.addEventListener('hashchange', handleHashChange);
    console.log("[Init] Hash Change Listener added.");
    console.log("Инициализация Personal Link Aggregator завершена.");
    console.log("------------------------------------------");
});
