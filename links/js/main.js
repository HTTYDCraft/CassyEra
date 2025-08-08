// main.js - Ваш оригинальный код + 1 исправление пути к data.json

// Импорт конфигурационных файлов
import { appConfig, profileConfig, linksConfig } from '../config.js'; 
import { strings } from '../strings.js'; 

/**
 * Импорт библиотеки Skinview3D.
 */
import * as skinview3d from "https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/+esm";

/**
 * @constant {object} DOM - Объект, содержащий ссылки на все используемые DOM-элементы.
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
    devLastUpdated: document.getElementById('dev-last-updated'),
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
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ru') ? 'ru' : 'en');
let appData = {};
let isDevViewActive = false;
let skinViewerInstance = null;

// --- Вспомогательные функции ---

const setVisibility = (element, isVisible) => {
    if (element) {
        if (isVisible) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
};

const renderView = (view) => {
    isDevViewActive = (view === 'dev');
    setVisibility(DOM.mainView, view === 'main');
    setVisibility(DOM.devView, view === 'dev');
    if (view === 'dev') {
        renderDevPage();
    }
    console.log(`[View] Переключен вид на: ${view}`);
};

const applyTheme = (theme) => {
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
    if (DOM.themeIcon) DOM.themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    if (DOM.themeToggle) DOM.themeToggle.setAttribute('aria-label', strings[currentLang][`theme${theme === 'dark' ? 'Light' : 'Dark'}`]);
    console.log(`[Theme] Применена тема: ${theme}`);
};

const updateLanguage = () => {
    console.log(`[Language] Обновление UI для языка: ${currentLang}`);
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
    if (DOM.profileName) DOM.profileName.textContent = strings[currentLang][profileConfig.name_key];
    if (DOM.profileDescription) DOM.profileDescription.textContent = strings[currentLang][profileConfig.description_key];
    if (DOM.avatar) DOM.avatar.alt = strings[currentLang].avatarAlt;
    if (DOM.previewAvatar) DOM.previewAvatar.alt = strings[currentLang].previewAvatarAlt;
    if (DOM.twitchMessage) DOM.twitchMessage.textContent = strings[currentLang].twitchStreamAlsoLive;
    renderLinksSection(linksConfig);
    calculateAndDisplayTotalFollowers();
    applyTheme(currentTheme);
    handleLiveStreamLayout();
};

const formatCount = (num) => {
    if (num === null || isNaN(num)) return strings[currentLang].loading;
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

const calculateAndDisplayTotalFollowers = () => {
    let total = 0;
    let allCountsAvailable = true;
    const sourceCounts = appData.followerCounts || {};
    for (const link of linksConfig) {
        if (link.isSocial && link.showSubscriberCount && link.active) {
            const count = sourceCounts[link.platformId];
            if (typeof count === 'number') {
                total += count;
                localStorage.setItem(`follower_count_${link.platformId}`, count.toString());
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
        if (DOM.totalFollowers) {
            DOM.totalFollowers.textContent = `${strings[currentLang].totalFollowers}${allCountsAvailable ? formatCount(total) : strings[currentLang].loading}`;
        }
    }
};

const fetchAppData = async () => {
    console.log("[Data Fetch] Попытка загрузки данных приложения из data.json...");
    try {
        // ИСПРАВЛЕНИЕ: Заменена одна строка для правильного пути к data.json
        const response = await fetch('../../data.json?t=' + Date.now()); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("[Data Fetch] Данные приложения успешно загружены:", data);
        return data;
    } catch (error) {
        console.error("[Data Fetch] Ошибка загрузки data.json. Использование fallback данных.", error);
        return {
            "followerCounts": { "youtube": null, "telegram": null, "instagram": null, "x": null, "twitch": null, "tiktok": null, "vk_group": null, "vk_personal": null },
            "youtubeVideos": [],
            "liveStream": { "type": "none" },
            "lastUpdated": new Date().toISOString(),
            "debugInfo": { "message": "Data loaded from client-side fallback due to data.json fetch error.", "status": "ERROR - Data.json failed to load", "error": error.message, "version": "client-fallback" }
        };
    }
};

const renderProfileSection = () => {
    setVisibility(DOM.profileSection, appConfig.showProfileSection);
    if (appConfig.showProfileSection) {
        if (DOM.avatar) DOM.avatar.src = profileConfig.avatar;
        if (DOM.profileName) DOM.profileName.textContent = strings[currentLang][profileConfig.name_key];
        if (DOM.profileDescription) DOM.profileDescription.textContent = strings[currentLang][profileConfig.description_key];
        if (DOM.avatar) DOM.avatar.alt = strings[currentLang].avatarAlt;
        console.log("[Render] Секция профиля отрисована.");
    }
};

const renderLinksSection = (links) => {
    setVisibility(DOM.linksSection, appConfig.showLinksSection);
    if (appConfig.showLinksSection) {
        DOM.linksSection.innerHTML = '';
        const sortedLinks = links.filter(link => link.active).sort((a, b) => a.order - b.order);
        sortedLinks.forEach(link => {
            const card = document.createElement('a');
            card.href = link.url;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.className = `card relative flex items-center justify-between p-4 rounded-2xl m3-shadow-md ${link.isSocial ? 'swipe-target' : ''} cursor-pointer`;
            card.setAttribute('data-link-id', link.label_key);
            card.setAttribute('data-platform-id', link.platformId || '');
            let previewTimeout;
            card.addEventListener('pointerenter', () => {
                clearTimeout(previewTimeout);
                if (!DOM.linkPreviewModal.classList.contains('active') || DOM.linkPreviewModal.dataset.currentLinkKey !== link.label_key) {
                    previewTimeout = setTimeout(() => showLinkPreview(link), 100);
                }
            });
            card.addEventListener('pointerleave', () => {
                clearTimeout(previewTimeout);
                hideLinkPreview();
            });
            card.addEventListener('click', (e) => {
                if (DOM.linkPreviewModal.classList.contains('active') && DOM.linkPreviewModal.dataset.currentLinkKey === link.label_key) {
                    // Разрешить клик
                } else {
                    e.preventDefault();
                    showLinkPreview(link);
                }
            });
            let iconHtml = '';
            if (link.customIconUrl) {
                iconHtml = `<img src="${link.customIconUrl}" alt="${strings[currentLang][link.label_key] || link.label_key} icon" class="custom-icon-image">`;
            } else if (link.icon) {
                iconHtml = `<span class="material-symbols-outlined icon-large">${link.icon}</span>`;
            } else {
                iconHtml = `<span class="material-symbols-outlined icon-large">link</span>`;
            }
            let followerCountHtml = '';
            if (link.isSocial && link.showSubscriberCount) {
                const count = appData.followerCounts ? appData.followerCounts[link.platformId] : undefined;
                followerCountHtml = `<span class="text-sm text-gray-400 mr-2 follower-count-display">${formatCount(count)}</span>`;
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
        console.log("[Render] Секция ссылок отрисована.");
        initSwipeGestures();
    }
};

const renderYouTubeVideosSection = () => {
    const videos = appData.youtubeVideos || [];
    setVisibility(DOM.youtubeVideosSection, appConfig.showYouTubeVideosSection && videos.length > 0);
    if (appConfig.showYouTubeVideosSection && videos.length > 0) {
        if (DOM.videoCarousel) DOM.videoCarousel.innerHTML = '';
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

const handleLiveStreamLayout = () => {
    const isDesktopHorizontal = window.matchMedia("(min-width: 768px) and (orientation: landscape)").matches;
    const shouldShowLiveStream = appConfig.showLiveStreamSection && appData.liveStream && appData.liveStream.type !== 'none';
    if (shouldShowLiveStream) {
        if (isDesktopHorizontal) {
            if (DOM.mediaBlockDesktop && !DOM.mediaBlockDesktop.contains(DOM.liveStreamSection)) {
                DOM.mediaBlockDesktop.prepend(DOM.liveStreamSection);
            }
            setVisibility(DOM.liveStreamSection, true);
            DOM.liveStreamSection.classList.add('md-visible');
        } else {
            if (DOM.liveStreamSection && DOM.profileSection && DOM.profileSection.nextSibling) {
                const currentParent = DOM.liveStreamSection.parentNode;
                if (currentParent !== DOM.mainView) {
                    DOM.mainView.insertBefore(DOM.liveStreamSection, DOM.profileSection.nextSibling);
                }
            }
            setVisibility(DOM.liveStreamSection, true);
            DOM.liveStreamSection.classList.remove('md-visible');
        }
        displayLiveStreamContent(appData.liveStream);
    } else {
        setVisibility(DOM.liveStreamSection, false);
        DOM.liveStreamSection.classList.remove('md-visible');
    }
    if (DOM.mediaBlockDesktop) {
        const showMediaBlock = isDesktopHorizontal &&
            (appConfig.showMinecraftSkinSection || shouldShowLiveStream);
        setVisibility(DOM.mediaBlockDesktop, showMediaBlock);
    }
};

const displayLiveStreamContent = (streamInfo) => {
    if (DOM.liveEmbed) DOM.liveEmbed.src = '';
    setVisibility(DOM.twitchNotification, false);
    if (streamInfo.type === 'youtube' && streamInfo.id) {
        if (DOM.liveEmbed) DOM.liveEmbed.src = `https://www.youtube.com/embed/${streamInfo.id}?autoplay=1&mute=0&controls=1`;
        if (streamInfo.twitchLive && streamInfo.twitchLive.twitchChannelName) {
            if (DOM.twitchMessage) DOM.twitchMessage.textContent = strings[currentLang].twitchStreamAlsoLive;
            if (DOM.twitchLink) DOM.twitchLink.href = `https://www.twitch.tv/${streamInfo.twitchLive.twitchChannelName}`;
            setVisibility(DOM.twitchNotification, true);
        }
    } else if (streamInfo.type === 'twitch' && streamInfo.twitchChannelName) {
        if (DOM.liveEmbed) DOM.liveEmbed.src = `https://player.twitch.tv/?channel=${streamInfo.twitchChannelName}&parent=${window.location.hostname}&autoplay=true&mute=false`;
    }
};

const manageFirstVisitModal = () => {
    if (!DOM.firstVisitModal) {
        console.warn("[Modal] Модальное окно первого посещения не найдено в DOM.");
        return;
    }
    const hasVisited = localStorage.getItem('visited_modal');
    if (!hasVisited) {
        if (DOM.modalTitle && DOM.modalDescription && DOM.modalCloseBtn) {
            setVisibility(DOM.firstVisitModal, true);
            DOM.modalCloseBtn.onclick = () => {
                setVisibility(DOM.firstVisitModal, false);
                localStorage.setItem('visited_modal', 'true');
            };
        }
    } else {
        setVisibility(DOM.firstVisitModal, false);
    }
};

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
            const horizontalMoveThreshold = 30;
            const verticalMoveTolerance = 0.5;
            if (!swipeStarted) {
                if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
                    isSwiping = false;
                    card.style.transform = 'translateX(0)';
                    card.classList.remove('swiping-left', 'swiping-right');
                    return;
                } else if (Math.abs(deltaX) > horizontalMoveThreshold && Math.abs(deltaX) > (Math.abs(deltaY) * verticalMoveTolerance)) {
                    swipeStarted = true;
                    e.preventDefault();
                } else if (Math.abs(deltaX) <= horizontalMoveThreshold && Math.abs(deltaY) <= 10) {
                    return;
                }
            }
            if (swipeStarted) {
                e.preventDefault();
                card.style.transform = `translateX(${deltaX}px)`;
                card.classList.remove('swiping-left', 'swiping-right');
                if (deltaX > 0) {
                    card.classList.add('swiping-right');
                } else {
                    card.classList.add('swiping-left');
                }
            }
        };
        const handleEnd = () => {
            if (!isSwiping && !swipeStarted) {
                card.style.transform = 'translateX(0)';
                card.classList.remove('swiping-left', 'swiping-right');
                card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease';
                return;
            }
            isSwiping = false;
            card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease';
            card.classList.remove('swiping-left', 'swiping-right');
            const deltaX = currentX - startX;
            const swipeThreshold = card.offsetWidth * 0.25;
            if (swipeStarted && Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0) {
                    const targetUrl = linkData.subscribeUrl || linkData.url;
                    window.open(targetUrl, '_blank');
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
        card._handleClickForPreview = (e) => {
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
        card.addEventListener('click', card._handleClickForPreview);
    });
};

const initMinecraftSkinViewer = () => {
    setVisibility(DOM.minecraftBlock, appConfig.showMinecraftSkinSection);
    if (!appConfig.showMinecraftSkinSection) return;
    if (!DOM.skinCanvas || !DOM.skinViewerContainer) return;
    if (skinViewerInstance) skinViewerInstance.dispose();
    try {
        skinViewerInstance = new skinview3d.SkinViewer({
            canvas: DOM.skinCanvas,
            width: DOM.skinViewerContainer.offsetWidth,
            height: DOM.skinViewerContainer.offsetHeight,
        });
        skinViewerInstance.loadSkin(profileConfig.minecraftSkinUrl)
            .then(() => {
                skinViewerInstance.animation = new skinview3d.WalkingAnimation();
                skinview3d.createOrbitControls(skinViewerInstance);
            })
            .catch(e => console.error("Ошибка загрузки скина:", e));
        new ResizeObserver(() => {
            if (skinViewerInstance) {
                skinViewerInstance.setSize(DOM.skinViewerContainer.offsetWidth, DOM.skinViewerContainer.offsetHeight);
            }
        }).observe(DOM.skinViewerContainer);
    } catch (error) {
        console.error("Ошибка инициализации 3D-просмотрщика скина:", error);
        setVisibility(DOM.minecraftBlock, false);
    }
    if (DOM.downloadSkinButton) DOM.downloadSkinButton.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = profileConfig.minecraftSkinUrl;
        a.download = 'minecraft_skin.png';
        a.click();
    });
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
    if (DOM.previewCloseButton) DOM.previewCloseButton.onclick = hideLinkPreview;
    if (DOM.previewAvatar) DOM.previewAvatar.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewName) DOM.previewName.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
    if (DOM.previewDescription) DOM.previewDescription.onclick = (e) => { e.preventDefault(); window.open(linkData.url, '_blank'); hideLinkPreview(); };
};

const hideLinkPreview = () => {
    DOM.linkPreviewModal._hideTimeout = setTimeout(() => {
        setVisibility(DOM.linkPreviewModal, false);
        DOM.linkPreviewModal.classList.remove('active');
        DOM.linkPreviewModal.dataset.currentLinkKey = '';
    }, 100);
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("------------------------------------------");
    console.log("DOMContentLoaded: Запуск инициализации приложения Personal Link Aggregator.");
    appData = await fetchAppData();
    renderProfileSection();
    applyTheme(currentTheme);
    updateLanguage();
    setVisibility(DOM.themeToggle, appConfig.showThemeToggle);
    if (appConfig.showThemeToggle && DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
        });
    }
    setVisibility(DOM.languageToggle, appConfig.showLanguageToggle);
    if (appConfig.showLanguageToggle && DOM.languageToggle) {
        DOM.languageToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ru' : 'en';
            localStorage.setItem('lang', currentLang);
            updateLanguage();
        });
    }
    setVisibility(DOM.devToggle, appConfig.developmentMode && appConfig.showDevToggle);
    if (appConfig.developmentMode && appConfig.showDevToggle && DOM.devToggle) {
        DOM.devToggle.addEventListener('click', () => renderView(isDevViewActive ? 'main' : 'dev'));
        if (DOM.backToMainButton) {
            DOM.backToMainButton.addEventListener('click', () => renderView('main'));
        }
    }
    const initialHash = window.location.hash;
    if (initialHash === '#/dev' && appConfig.developmentMode) {
        renderView('dev');
    } else {
        renderView('main');
    }
    const checkSkinViewerReadyTimeout = setTimeout(() => {
        if (typeof skinview3d !== 'undefined' && typeof skinview3d.SkinViewer !== 'undefined') {
            initMinecraftSkinViewer();
        } else {
            console.error("[Init] Библиотека skinview3d не загрузилась вовремя.");
            setVisibility(DOM.minecraftBlock, false);
        }
    }, 100);
    setupSupportButton();
    renderYouTubeVideosSection();
    handleLayout();
    window.addEventListener('resize', handleLayout);
    manageFirstVisitModal();
    setupAnalytics();
    console.log("Инициализация Personal Link Aggregator завершена.");
    console.log("------------------------------------------");
});
