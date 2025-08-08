// main.js - Финальная рабочая версия с исправленным скином и прокруткой карусели.

import { appConfig, profileConfig, linksConfig } from '../config.js';
import { strings } from '../strings.js';
import * as skinview3d from "https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/+esm";

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

let currentTheme = localStorage.getItem('theme') || 'dark';
let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ru') ? 'ru' : 'en');
let appData = {};
let isDevViewActive = false;
let skinViewerInstance = null;

const setVisibility = (element, isVisible) => {
    if (element) {
        element.classList.toggle('hidden', !isVisible);
    }
};

const renderView = (view) => {
    isDevViewActive = (view === 'dev');
    setVisibility(DOM.mainView, view === 'main');
    setVisibility(DOM.devView, view === 'dev');
    if (view === 'dev') {
        renderDevPage();
    }
};

const applyTheme = (theme) => {
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
    if (DOM.themeIcon) DOM.themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
};

const updateLanguage = () => {
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
    handleLayout();
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
    const sourceCounts = appData.followerCounts || {};
    for (const link of linksConfig) {
        if (link.isSocial && link.showSubscriberCount && link.active) {
            const count = sourceCounts[link.platformId];
            if (typeof count === 'number') {
                total += count;
            }
        }
    }
    if (DOM.totalFollowers) {
        DOM.totalFollowers.textContent = `${strings[currentLang].totalFollowers} ${formatCount(total)}`;
    }
};

const fetchAppData = async () => {
    try {
        const response = await fetch('../data.json?t=' + Date.now());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Ошибка загрузки data.json:", error);
        return { followerCounts: {}, youtubeVideos: [], liveStream: { type: "none" } };
    }
};

const renderProfileSection = () => {
    setVisibility(DOM.profileSection, appConfig.showProfileSection);
    if (appConfig.showProfileSection) {
        DOM.avatar.src = profileConfig.avatar;
    }
};

const renderLinksSection = (links) => {
    setVisibility(DOM.linksSection, appConfig.showLinksSection);
    if (!appConfig.showLinksSection) return;

    DOM.linksSection.innerHTML = '';
    const sortedLinks = links.filter(link => link.active).sort((a, b) => a.order - b.order);
    sortedLinks.forEach(link => {
        const card = document.createElement('a');
        card.href = link.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.className = `card relative flex items-center justify-between p-4 rounded-2xl m3-shadow-md ${link.isSocial ? 'swipe-target' : ''} cursor-pointer`;
        card.setAttribute('data-link-id', link.label_key);
        
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
                // Allow click
            } else {
                e.preventDefault();
                showLinkPreview(link);
            }
        });
        
        const count = appData.followerCounts ? appData.followerCounts[link.platformId] : undefined;
        const followerCountHtml = (link.isSocial && link.showSubscriberCount)
            ? `<span class="text-sm text-gray-400 mr-2 follower-count-display">${formatCount(count)}</span>`
            : '';
        const iconHtml = link.customIconUrl
            ? `<img src="${link.customIconUrl}" alt="" class="custom-icon-image">`
            : `<span class="material-symbols-outlined icon-large">${link.icon || 'link'}</span>`;

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
    initSwipeGestures();
};

const renderYouTubeVideosSection = () => {
    const videos = appData.youtubeVideos || [];
    setVisibility(DOM.youtubeVideosSection, appConfig.showYouTubeVideosSection && videos.length > 0);
    if (!appConfig.showYouTubeVideosSection || videos.length === 0) return;

    DOM.videoCarousel.innerHTML = '';
    videos.forEach(video => {
        const videoCard = document.createElement('a');
        videoCard.href = `https://www.youtube.com/watch?v=${video.id}`;
        videoCard.target = "_blank";
        videoCard.className = "flex-shrink-0 w-64 rounded-2xl overflow-hidden m3-shadow-md card";
        videoCard.innerHTML = `
            <img src="${video.thumbnailUrl}" alt="${video.title}" class="w-full h-36 object-cover">
            <div class="p-3"><p class="text-sm font-medium leading-tight">${video.title}</p></div>
        `;
        DOM.videoCarousel.appendChild(videoCard);
    });
    
    // ИСПРАВЛЕНИЕ: Добавляем слушатель для прокрутки колесиком
    DOM.videoCarousel.addEventListener('wheel', (event) => {
        if (event.deltaY !== 0) {
            event.preventDefault();
            DOM.videoCarousel.scrollLeft += event.deltaY;
        }
    });
};

const handleLayout = () => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const shouldShowStream = appConfig.showLiveStreamSection && appData.liveStream && appData.liveStream.type !== 'none';
    const shouldShowSkin = appConfig.showMinecraftSkinSection;

    setVisibility(DOM.liveStreamSection, shouldShowStream);
    setVisibility(DOM.minecraftBlock, shouldShowSkin);

    if (isDesktop) {
        if (shouldShowStream && !DOM.mediaBlockDesktop.contains(DOM.liveStreamSection)) {
            DOM.mediaBlockDesktop.appendChild(DOM.liveStreamSection);
        }
        if (shouldShowSkin && !DOM.mediaBlockDesktop.contains(DOM.minecraftBlock)) {
            DOM.mediaBlockDesktop.appendChild(DOM.minecraftBlock);
        }
    } else {
        // На мобильных возвращаем в основной поток документа
        if (shouldShowStream && DOM.mediaBlockDesktop.contains(DOM.liveStreamSection)) {
            DOM.profileSection.after(DOM.liveStreamSection);
        }
        if (shouldShowSkin && DOM.mediaBlockDesktop.contains(DOM.minecraftBlock)) {
            (DOM.liveStreamSection.nextSibling || DOM.profileSection).after(DOM.minecraftBlock);
        }
    }
    
    if (shouldShowStream) {
        displayLiveStreamContent(appData.liveStream);
    }
    
    // ИСПРАВЛЕНИЕ: Инициализируем скин только ПОСЛЕ того, как его контейнер точно видим
    if (shouldShowSkin) {
        initMinecraftSkinViewer();
    }
};

const displayLiveStreamContent = (streamInfo) => {
    if (DOM.liveEmbed.src.includes(streamInfo.id || streamInfo.twitchChannelName)) return; // Не перезагружаем, если уже тот же стрим
    if (streamInfo.type === 'youtube') {
        DOM.liveEmbed.src = `https://www.youtube.com/embed/${streamInfo.id}?autoplay=1&mute=1`;
        setVisibility(DOM.twitchNotification, !!streamInfo.twitchLive);
        if (streamInfo.twitchLive) {
            DOM.twitchLink.href = `https://www.twitch.tv/${streamInfo.twitchLive.twitchChannelName}`;
        }
    } else if (streamInfo.type === 'twitch') {
        DOM.liveEmbed.src = `https://player.twitch.tv/?channel=${streamInfo.twitchChannelName}&parent=${window.location.hostname}&autoplay=true&mute=1`;
    }
};

const manageFirstVisitModal = () => { /* ... ваш оригинальный код ... */
    if (!DOM.firstVisitModal) return;
    const hasVisited = localStorage.getItem('visited_modal');
    if (!hasVisited) {
        setVisibility(DOM.firstVisitModal, true);
        DOM.firstVisitModal.style.display = 'flex';
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

const initSwipeGestures = () => { /* ... ваш оригинальный код ... */
    const swipeTargets = document.querySelectorAll('.swipe-target');
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
            if (!swipeStarted && Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
                swipeStarted = true;
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
            const wasSwiping = swipeStarted;
            isSwiping = false;
            swipeStarted = false;
            card.style.transition = 'transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease';
            const deltaX = currentX - startX;
            if (wasSwiping && Math.abs(deltaX) > card.offsetWidth * 0.25) {
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
            card.classList.remove('swiping-left', 'swiping-right');
        };
        card.addEventListener('mousedown', handleStart);
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseup', handleEnd);
        card.addEventListener('mouseleave', handleEnd);
        card.addEventListener('touchstart', handleStart, { passive: true });
        card.addEventListener('touchmove', handleMove, { passive: false });
        card.addEventListener('touchend', handleEnd);
        card.addEventListener('click', e => {
            if (swipeStarted) e.preventDefault();
        }, true);
    });
};

// ИСПРАВЛЕНИЕ: Полностью заменяем эту функцию на более надежную
const initMinecraftSkinViewer = () => {
    if (!appConfig.showMinecraftSkinSection || !DOM.skinCanvas) return;
    
    // Если экземпляр уже есть, ничего не делаем
    if (skinViewerInstance) return;

    // Проверяем, что библиотека загружена
    if (typeof skinview3d === 'undefined' || typeof skinview3d.SkinViewer === 'undefined') {
        console.error("Библиотека skinview3d не загружена.");
        setVisibility(DOM.minecraftBlock, false);
        return;
    }

    try {
        console.log("[SkinViewer] Попытка инициализации...");
        skinViewerInstance = new skinview3d.SkinViewer({
            canvas: DOM.skinCanvas,
            width: DOM.skinViewerContainer.offsetWidth,
            height: DOM.skinViewerContainer.offsetHeight,
            skin: profileConfig.minecraftSkinUrl,
        });

        skinViewerInstance.animation = new skinview3d.WalkingAnimation();
        skinViewerInstance.controls.enableZoom = false;

        new ResizeObserver(() => {
            if (skinViewerInstance) {
                skinViewerInstance.setSize(
                    DOM.skinViewerContainer.offsetWidth,
                    DOM.skinViewerContainer.offsetHeight
                );
            }
        }).observe(DOM.skinViewerContainer);

        console.log("[SkinViewer] 3D-просмотрщик скина успешно инициализирован.");
    } catch (e) {
        console.error("Ошибка при инициализации SkinViewer:", e);
        setVisibility(DOM.minecraftBlock, false);
    }
};

const downloadMinecraftSkin = () => { /* ... ваш оригинальный код ... */
    if (profileConfig.minecraftSkinUrl) {
        const a = document.createElement('a');
        a.href = profileConfig.minecraftSkinUrl;
        a.download = 'minecraft_skin.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

const setupSupportButton = () => { /* ... ваш оригинальный код ... */
    setVisibility(DOM.supportSection, appConfig.showSupportButton);
    if (appConfig.showSupportButton) {
        DOM.supportButton.href = appConfig.supportUrl || "#";
    }
};

const renderDevPage = () => { /* ... ваш оригинальный код ... */
    if (DOM.devLastUpdated) DOM.devLastUpdated.textContent = appData.lastUpdated ? new Date(appData.lastUpdated).toLocaleString(currentLang) : 'N/A';
    if (DOM.devDataJsonContent) DOM.devDataJsonContent.textContent = JSON.stringify(appData, null, 2);
    if (DOM.devDebugInfoContent) DOM.devDebugInfoContent.textContent = JSON.stringify(appData.debugInfo || {}, null, 2);
};

const setupAnalytics = () => { /* ... ваш оригинальный код ... */
    console.log("[Analytics] Настройка заглушки Google Analytics...");
};

const showLinkPreview = (linkData) => { /* ... ваш оригинальный код ... */
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

const hideLinkPreview = () => { /* ... ваш оригинальный код ... */
    DOM.linkPreviewModal._hideTimeout = setTimeout(() => {
        setVisibility(DOM.linkPreviewModal, false);
        DOM.linkPreviewModal.classList.remove('active');
        DOM.linkPreviewModal.dataset.currentLinkKey = '';
    }, 100);
};


document.addEventListener('DOMContentLoaded', async () => {
    console.log("------------------------------------------");
    console.log("DOMContentLoaded: Запуск инициализации.");

    appData = await fetchAppData();
    
    renderProfileSection();
    applyTheme(currentTheme);
    updateLanguage();

    setVisibility(DOM.themeToggle, appConfig.showThemeToggle);
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
        });
    }

    setVisibility(DOM.languageToggle, appConfig.showLanguageToggle);
    if (DOM.languageToggle) {
        DOM.languageToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ru' : 'en';
            localStorage.setItem('lang', currentLang);
            updateLanguage();
        });
    }

    setVisibility(DOM.devToggle, appConfig.developmentMode && appConfig.showDevToggle);
    if (DOM.devToggle) {
        DOM.devToggle.addEventListener('click', () => renderView(isDevViewActive ? 'main' : 'dev'));
        if (DOM.backToMainButton) {
            DOM.backToMainButton.addEventListener('click', () => renderView('main'));
        }
    }

    if (window.location.hash === '#/dev' && appConfig.developmentMode) {
        renderView('dev');
    }

    // initMinecraftSkinViewer(); // Убрали отсюда, теперь вызывается в handleLayout
    setupSupportButton();
    renderYouTubeVideosSection();
    handleLayout();
    window.addEventListener('resize', handleLayout);
    manageFirstVisitModal();
    setupAnalytics();

    console.log("Инициализация завершена.");
    console.log("------------------------------------------");
});
