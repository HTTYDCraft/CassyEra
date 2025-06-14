// links/js/main.js
// Основной JavaScript-файл для Personal Link Aggregator

// Импортируем конфигурационные данные и текстовые строки из отдельных файлов
import { appConfig, profileConfig, linksConfig } from './config.js';
import { strings } from './strings.js';

// --- DOM Element References ---
const app = document.getElementById('app');
const offlineWarning = document.getElementById('offline-warning');
const offlineMessage = document.getElementById('offline-message');

const mainView = document.getElementById('main-view');
const devView = document.getElementById('dev-view');

const liveStreamSection = document.getElementById('live-stream-section');
const profileSection = document.getElementById('profile-section');
const linksSection = document.getElementById('links-section');
const supportSection = document.getElementById('support-section');
const supportButton = document.getElementById('support-button');
const supportButtonText = document.getElementById('support-button-text');
const minecraftBlock = document.querySelector('.minecraft-block');
const youtubeVideosSection = document.getElementById('youtube-videos-section');
const videoCarousel = document.getElementById('video-carousel');
const liveEmbed = document.getElementById('live-embed');
const twitchNotification = document.getElementById('twitch-notification');
const twitchMessage = document.getElementById('twitch-message');
const twitchLink = document.getElementById('twitch-link');
const twitchLinkText = document.getElementById('twitch-link-text');

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const languageToggle = document.getElementById('language-toggle');
const devToggle = document.getElementById('dev-toggle');
const backToMainButton = document.getElementById('back-to-main-button');

const firstVisitModal = document.getElementById('first-visit-modal');
const modalCloseBtn = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const recentVideosTitle = document.getElementById('recent-videos-title');
const totalFollowersElement = document.getElementById('total-followers');
const minecraftTitleElement = document.getElementById('minecraft-title');
const downloadSkinButton = document.getElementById('download-skin-button');
const downloadSkinText = document.getElementById('download-skin-text');

const devTitle = document.getElementById('dev-title');
const devLastUpdatedLabel = document.getElementById('dev-last-updated-label');
const devLastUpdated = document.getElementById('dev-last-updated');
const devDataJsonContentLabel = document.getElementById('dev-data-json-content-label');
const devDataJsonContent = document.getElementById('dev-data-json-content');
const devDebugInfoContentLabel = document.getElementById('dev-debug-info-content-label');
const devDebugInfoContent = document.getElementById('dev-debug-info-content');
const backToMainText = document.getElementById('back-to-main-text');


// --- Application State ---
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ru') ? 'ru' : 'en');
let skinViewer = null; // Minecraft Skin Viewer instance
let appData = {}; // Data fetched from data.json

// --- View Management ---
const renderView = (view) => {
    if (view === 'main') {
        mainView.classList.remove('hidden');
        devView.classList.add('hidden');
    } else if (view === 'dev') {
        mainView.classList.add('hidden');
        devView.classList.remove('hidden');
        renderDevPage(); // Render dev page content when activated
    }
};

const handleHashChange = () => {
    if (window.location.hash === '#/dev' && appConfig.developmentMode) {
        renderView('dev');
    } else {
        renderView('main');
    }
};

/**
 * Применяет выбранную тему (темную или светлую) к телу документа.
 */
const applyTheme = (theme) => {
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
    themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    themeToggle.setAttribute('aria-label', strings[currentLang][`theme${theme === 'dark' ? 'Light' : 'Dark'}`]);
};

/**
 * Обновляет весь динамический текстовый контент в пользовательском интерфейсе
 * на основе текущего языка.
 */
const updateLanguage = () => {
    // Main page texts
    recentVideosTitle.textContent = strings[currentLang].recentVideosTitle;
    minecraftTitleElement.textContent = strings[currentLang].minecraftTitle;
    downloadSkinText.textContent = strings[currentLang].downloadSkin;
    supportButtonText.textContent = strings[currentLang].supportButton;
    offlineMessage.textContent = strings[currentLang].offlineMessage;
    twitchLinkText.textContent = strings[currentLang].watchOnTwitch;

    // Modal texts
    modalTitle.textContent = strings[currentLang].modalTitle;
    modalDescription.textContent = strings[currentLang].modalDescription;
    modalCloseBtn.textContent = strings[currentLang].gotItButton;

    // Dev page texts
    devTitle.textContent = strings[currentLang].devPageTitle;
    devLastUpdatedLabel.textContent = strings[currentLang].devLastUpdatedLabel;
    devDataJsonContentLabel.textContent = strings[currentLang].devDataJsonContentLabel;
    devDebugInfoContentLabel.textContent = strings[currentLang].devDebugInfoContentLabel;
    backToMainText.textContent = strings[currentLang].backToMainText;

    applyTheme(currentTheme); // Re-apply theme to update button aria-label
    renderLinks(linksConfig); // Re-render links to update labels and ensure proper language
    calculateAndDisplayTotalFollowers(); // Recalculate and display total followers
};

/**
 * Рендерит секцию профиля, используя данные из `profileConfig`.
 */
const renderProfile = () => {
    if (appConfig.showProfileSection) {
        profileSection.classList.remove('hidden');
        document.getElementById('avatar').src = profileConfig.avatar;
        document.getElementById('profile-name').textContent = profileConfig.name;
        document.getElementById('profile-description').textContent = profileConfig.description;
    } else {
        profileSection.classList.add('hidden');
    }
};

/**
 * Formats a raw number into a human-readable string (e.g., 1234567 -> 1.23M).
 * @param {number} num - The number to format.
 * @returns {string} Formatted number string.
 */
const formatCount = (num) => {
    if (num === null || isNaN(num)) return strings[currentLang].loading;
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

/**
 * Calculates and displays the total follower count from loaded data.
 */
const calculateAndDisplayTotalFollowers = () => {
    let total = 0;
    let allCountsAvailable = true;

    const sourceCounts = appData.followerCounts || {};

    for (const link of linksConfig) {
        if (link.isSocial && link.showSubscriberCount && link.active) { // Check 'active' field
            const count = sourceCounts[link.platformId];
            if (typeof count === 'number') {
                total += count;
            } else {
                // Fallback to localStorage for platforms not updated by action (e.g., Instagram, X, TikTok)
                const cachedCount = localStorage.getItem(`follower_count_${link.platformId}`);
                if (cachedCount && !isNaN(parseInt(cachedCount))) {
                    total += parseInt(cachedCount);
                } else {
                    allCountsAvailable = false;
                }
            }
        }
    }

    if (appConfig.showProfileSection) {
        if (allCountsAvailable) {
            totalFollowersElement.textContent = `${strings[currentLang].totalFollowers}${formatCount(total)}`;
        } else {
            totalFollowersElement.textContent = `${strings[currentLang].totalFollowers}${strings[currentLang].loading}`;
        }
    }
};

/**
 * Fetches data from data.json (or local storage if cached and fresh enough).
 * Uses cache-busting for fresh fetches.
 * @returns {Promise<Object>} A promise resolving to the data object.
 */
const fetchAppData = async () => {
    const cacheKey = 'app_data_cache';
    const cachedData = localStorage.getItem(cacheKey);

    if (!navigator.onLine) {
        offlineWarning.classList.remove('hidden');
        if (cachedData) {
            console.log("[Data Fetch] Offline, using cached data.");
            try { return JSON.parse(cachedData); } catch { return {}; }
        } else {
            console.warn("[Data Fetch] Offline and no cache available.");
            return {};
        }
    } else {
         offlineWarning.classList.add('hidden');
    }

    try {
        console.log("[Data Fetch] Fetching new data from data.json...");
        // Append a unique query parameter to bust browser cache
        const response = await fetch(`${appConfig.dataUrl}?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    }
    catch (error) {
        console.error("Error fetching app data:", error);
        if (cachedData) {
            console.log("[Data Fetch] Error fetching new data, using cached data.");
            try { return JSON.parse(cachedData); } catch { return {}; }
        }
        return {};
    }
};


/**
 * Renders link cards from the `linksConfig` array, using data from `appData`.
 */
const renderLinks = async (links) => {
    if (appConfig.showLinksSection) {
        linksSection.classList.remove('hidden');
        linksSection.innerHTML = '';
        const sortedLinks = [...links].sort((a, b) => a.order - b.order);

        for (const link of sortedLinks) {
            if (!link.active) { // NEW: Проверяем, активна ли ссылка
                continue; // Пропускаем неактивные ссылки
            }

            const card = document.createElement('a');
            card.href = link.url;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.className = `card relative flex items-center justify-between p-4 rounded-2xl m3-shadow-md ${link.isSocial ? 'swipe-target' : ''}`;
            card.setAttribute('data-link-id', link.label_key); // Используем label_key как ID
            card.setAttribute('data-platform-id', link.platformId || '');
            
            // NEW: Создание SVG иконки из Simple Icons
            let iconHtml = '';
            if (link.icon) {
                // simpleIcons.get(link.icon) возвращает объект с SVG-путем
                const simpleIcon = window.SimpleIcons && window.SimpleIcons.get(link.icon);
                if (simpleIcon) {
                    iconHtml = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="si-icon" style="fill:#${simpleIcon.hex || 'currentColor'};"><title>${link.label_key}</title><path d="${simpleIcon.path}"/></svg>`;
                } else {
                    // Fallback to Material Symbols if Simple Icon not found
                    iconHtml = `<span class="material-symbols-outlined text-2xl mr-4">${link.icon}</span>`;
                    console.warn(`Simple Icon '${link.icon}' not found, falling back to Material Symbols.`);
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

            // NEW: Используем strings[currentLang][link.label_key] для переведенного лейбла
            card.innerHTML = `
                <div class="flex items-center">
                    ${iconHtml}
                    <div>
                        <span class="block text-lg font-medium">${strings[currentLang][link.label_key] || link.label_key}</span>
                        ${link.isSocial && link.showSubscriberCount ? followerCountHtml : ''}
                    </div>
                </div>
            `;
            linksSection.appendChild(card);
        }
        calculateAndDisplayTotalFollowers();
    } else {
        linksSection.classList.add('hidden');
    }
};

/**
 * Renders the recent YouTube videos into a horizontal carousel, using data from `appData`.
 */
const renderYouTubeVideos = () => {
    const videos = appData.youtubeVideos || [];
    if (appConfig.showYouTubeVideosSection && videos.length > 0) {
        youtubeVideosSection.classList.remove('hidden');
        videoCarousel.innerHTML = '';

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
            videoCarousel.appendChild(videoCard);
        });
    } else {
        youtubeVideosSection.classList.add('hidden');
    }
};

/**
 * Displays the live stream embedded player and/or Twitch notification based on stream info from `appData`.
 */
const displayLiveStream = () => {
    const streamInfo = appData.liveStream || { type: 'none' };
    if (appConfig.showLiveStreamSection) {
        liveStreamSection.classList.add('hidden');
        twitchNotification.classList.add('hidden');
        liveEmbed.src = '';

        if (streamInfo.type === 'youtube' && streamInfo.id) {
            liveEmbed.src = `https://www.youtube.com/embed/${streamInfo.id}?autoplay=1&mute=0&controls=1`;
            liveStreamSection.classList.remove('hidden');
            if (streamInfo.twitchLive && streamInfo.twitchLive.twitchChannelName) {
                twitchMessage.textContent = `${streamInfo.twitchLive.title} также в эфире на Twitch!`;
                twitchLink.href = `https://www.twitch.tv/${streamInfo.twitchLive.twitchChannelName}`;
                twitchNotification.classList.remove('hidden');
            }
        } else if (streamInfo.type === 'twitch' && streamInfo.twitchChannelName) {
            liveEmbed.src = `https://player.twitch.tv/?channel=${streamInfo.twitchChannelName}&parent=${window.location.hostname}&autoplay=true&mute=false`;
            liveStreamSection.classList.remove('hidden');
        }
    } else {
        liveStreamSection.classList.add('hidden');
    }
};

/**
 * Manages the first-visit instruction modal. Shows it only once per user.
 */
const manageFirstVisitModal = () => {
    const hasVisited = localStorage.getItem('visited_modal');
    if (!hasVisited) {
        firstVisitModal.style.display = 'flex';
        modalCloseBtn.onclick = () => {
            firstVisitModal.style.display = 'none';
            localStorage.setItem('visited_modal', 'true');
        };
    }
};

/**
 * Инициализирует swipe-жесты для элементов с классом 'swipe-target'.
 */
const initSwipeGestures = () => {
    const swipeTargets = document.querySelectorAll('.swipe-target');
    swipeTargets.forEach(card => {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        // NEW: Используем data-link-id для поиска ссылки, так как label теперь ключ
        const linkData = linksConfig.find(link => link.label_key === card.getAttribute('data-link-id'));
        if (!linkData) return;

        const handleStart = (e) => {
            isSwiping = true;
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            card.style.transition = 'none'; // Disable CSS transition during active swipe
        };

        const handleMove = (e) => {
            if (!isSwiping) return;
            currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - startX;
            card.style.transform = `translateX(${deltaX}px)`;

            card.classList.remove('swiping-left', 'swiping-right');
            if (deltaX > 20) {
                card.classList.add('swiping-right');
            } else if (deltaX < -20) {
                card.classList.add('swiping-left');
            }
        };

        const handleEnd = (e) => {
            if (!isSwiping) return;
            isSwiping = false;
            card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease'; // Re-enable transitions
            card.classList.remove('swiping-left', 'swiping-right');

            const deltaX = currentX - startX;
            const swipeThreshold = card.offsetWidth * 0.25;

            if (Math.abs(deltaX) > swipeThreshold) { // Check if swipe distance is significant
                if (deltaX > 0) { // Swiped right
                    // NEW: Используем subscribeUrl для свайпа вправо, если оно есть
                    if (linkData.subscribeUrl) {
                        window.open(linkData.subscribeUrl, '_blank');
                        console.log(`Свайп вправо: Попытка подписаться на ${strings[currentLang][linkData.label_key]}`);
                    } else {
                        window.open(linkData.url, '_blank');
                        console.log(`Свайп вправо: Открытие ${strings[currentLang][linkData.label_key]}`);
                    }
                } else { // Swiped left
                    // Only specific action for YouTube on left swipe (open latest video/stream)
                    if (linkData.platformId === 'youtube') {
                        const liveStream = appData.liveStream;
                        if (liveStream && liveStream.type === 'youtube' && liveStream.id) {
                            window.open(`https://www.youtube.com/watch?v=${liveStream.id}`, '_blank');
                            console.log(`Свайп влево: Открытие текущего YouTube стрима`);
                        } else if (appData.youtubeVideos && appData.youtubeVideos.length > 0) {
                            window.open(`https://www.youtube.com/watch?v=${appData.youtubeVideos[0].id}`, '_blank');
                            console.log(`Свайп влево: Открытие последнего YouTube видео`);
                        } else {
                            window.open(linkData.url, '_blank');
                            console.log(`Свайп влево: Открытие YouTube канала (нет видео/стримов)`);
                        }
                    } else {
                        window.open(linkData.url, '_blank');
                        console.log(`Свайп влево: Открытие ${strings[currentLang][linkData.label_key]}`);
                    }
                }
            }
            card.style.transform = 'translateX(0)'; // Reset card position
        };

        // Mouse events for desktop
        card.addEventListener('mousedown', handleStart);
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseup', handleEnd);
        card.addEventListener('mouseleave', handleEnd);

        // Touch events for mobile
        card.addEventListener('touchstart', (e) => {
            handleStart(e);
        }, { passive: false });
        card.addEventListener('touchmove', (e) => {
            handleMove(e);
        }, { passive: false });
        card.addEventListener('touchend', handleEnd);
    });
};

/**
 * Инициализирует 3D-просмотрщик скина Minecraft.
 */
const initMinecraftSkinViewer = () => {
    if (appConfig.showMinecraftSkinSection) {
        minecraftBlock.classList.remove('hidden');
        const canvas = document.getElementById('skin-canvas');
        const container = document.getElementById('skin-viewer-container');

        if (skinViewer) {
            skinViewer.dispose();
        }

        skinViewer = new skinview3d.SkinViewer({
            canvas: canvas,
            width: container.offsetWidth,
            height: container.offsetHeight,
            skin: profileConfig.minecraftSkinUrl
        });

        skinViewer.animation = new skinview3d.WalkingAnimation();

        let isDragging = false;
        let previousMouseX = 0;
        let previousMouseY = 0;

        const mouseOrTouchStart = (e) => {
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            previousMouseX = clientX;
            previousMouseY = clientY;
            if (!e.touches) canvas.style.cursor = 'grabbing';
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
            canvas.style.cursor = 'grab';
        };

        canvas.addEventListener('mousedown', mouseOrTouchStart);
        canvas.addEventListener('mousemove', mouseOrTouchMove);
        canvas.addEventListener('mouseup', mouseOrTouchEnd);
        canvas.addEventListener('mouseleave', mouseOrTouchEnd);

        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); mouseOrTouchStart(e); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); mouseOrTouchMove(e); }, { passive: false });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); mouseOrTouchEnd(e); }, { passive: false });


        new ResizeObserver(() => {
            skinViewer.setSize(container.offsetWidth, container.offsetHeight);
        }).observe(container);
    } else {
        minecraftBlock.classList.add('hidden');
        if (skinViewer) {
            skinViewer.dispose();
            skinViewer = null;
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
    } else {
        console.warn("URL скина Minecraft не задан.");
    }
};

/**
 * Sets up the support button visibility and link.
 */
const setupSupportButton = () => {
    if (appConfig.showSupportButton) {
        supportSection.classList.remove('hidden');
        supportButton.href = appConfig.supportUrl;
        supportButtonText.textContent = strings[currentLang].supportButton;
    } else {
        supportSection.classList.add('hidden');
    }
};

/**
 * Renders content for the developer page.
 */
const renderDevPage = () => {
    devLastUpdated.textContent = appData.lastUpdated ? new Date(appData.lastUpdated).toLocaleString(currentLang) : 'N/A';
    devDataJsonContent.textContent = JSON.stringify(appData, null, 2);
    devDebugInfoContent.textContent = JSON.stringify(appData.debugInfo || {}, null, 2);
};

/**
 * Placeholder for Google Analytics (GA4) integration.
 */
const setupAnalytics = () => {
    console.log("Настройка заглушки Google Analytics...");
};

// --- Initial Load and Event Listeners Setup ---

window.onload = async () => {
    console.log("Окно загружено. Инициализация приложения Personal Link Aggregator.");

    // 1. Fetch initial app data (from data.json or cache)
    appData = await fetchAppData();

    // 2. Render Profile (visibility controlled by appConfig)
    renderProfile();

    // 3. Apply initial theme and language
    applyTheme(currentTheme);
    updateLanguage(); // Update language also renders links now

    // 4. Set up Theme Toggle
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    });

    // 5. Set up Language Toggle
    languageToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ru' : 'en';
        localStorage.setItem('lang', currentLang);
        updateLanguage();
    });

    // 6. Setup Developer Mode Toggle
    if (appConfig.developmentMode) {
        devToggle.classList.remove('hidden');
        devToggle.addEventListener('click', () => {
            window.location.hash = (window.location.hash === '#/dev') ? '' : '#/dev';
        });
        backToMainButton.addEventListener('click', () => {
            window.location.hash = '';
        });
    } else {
        devToggle.classList.add('hidden');
    }
    handleHashChange(); // Check URL hash on load

    // 7. Render Links and populate follower counts (now part of updateLanguage, but ensure initial render)
    // Removed redundant renderLinks(linksConfig) call here as it's now in updateLanguage()

    // 8. Initialize Minecraft Skin Viewer (visibility controlled by appConfig)
    initMinecraftSkinViewer();
    downloadSkinButton.addEventListener('click', downloadMinecraftSkin);

    // 9. Setup Support Button (visibility controlled by appConfig)
    setupSupportButton();

    // 10. Render YouTube Videos (visibility controlled by appConfig)
    renderYouTubeVideos();

    // 11. Display Live Streams (visibility controlled by appConfig)
    displayLiveStream();

    // 12. Manage First Visit Modal
    manageFirstVisitModal();

    // 13. Initialize Swipe Gestures
    initSwipeGestures();

    // 14. Setup Google Analytics (placeholder)
    setupAnalytics();

    // Listen for hash changes to switch views
    window.addEventListener('hashchange', handleHashChange);
};
