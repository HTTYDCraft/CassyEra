// config.js - Конфигурационные настройки приложения

/**
 * @constant {object} appConfig - Основные конфигурационные настройки приложения.
 * Определяет видимость различных секций и кнопок UI, а также режим разработчика.
 * `dataUrl`: URL для загрузки данных (в этой версии используется имитация данных).
 * `showLiveStreamSection`: Показывать секцию прямой трансляции.
 * `showProfileSection`: Показывать секцию профиля.
 * `showMinecraftSkinSection`: Показывать секцию 3D-просмотрщика скина Minecraft.
 * `showLinksSection`: Показывать секцию ссылок.
 * `showYouTubeVideosSection`: Показывать секцию последних видео YouTube.
 * `showSupportButton`: Показывать кнопку поддержки/доната.
 * `developmentMode`: Включен ли режим разработчика (влияет на доступ к dev-view).
 * `showDevToggle`: Показывать ли кнопку переключения режима разработчика в UI.
 * `showLanguageToggle`: Показывать ли кнопку смены языка в UI.
 * `showThemeToggle`: Показывать ли кнопку смены темы в UI.
 */
export const appConfig = {
    "dataUrl": "./data.json", // Путь к файлу с данными (должен быть сгенерирован серверной частью)
    "showLiveStreamSection": true,
    "showProfileSection": true,
    "showMinecraftSkinSection": true,
    "showLinksSection": true,
    "showYouTubeVideosSection": true,
    "showSupportButton": true,
    "developmentMode": true,
    "showDevToggle": true,
    "showLanguageToggle": true,
    "showThemeToggle": true
};

/**
 * @constant {object} profileConfig - Конфигурационные настройки профиля пользователя.
 * `name_key`: Ключ для имени профиля в объекте `strings` для локализации.
 * `description_key`: Ключ для описания профиля в объекте `strings` для локализации.
 * `avatar`: Путь к файлу аватара профиля.
 * `minecraftSkinUrl`: Путь к файлу скина Minecraft (PNG).
 */
export const profileConfig = {
    "name_key": "profileName",
    "description_key": "profileDescription",
    "avatar": "./assets/avatar.png",
    "minecraftSkinUrl": "./assets/skin.png" // Изменено на skin.png
};

/**
 * @constant {Array<object>} linksConfig - Конфигурация для всех ссылок на сайте.
 * Каждый объект представляет собой отдельную ссылку с её свойствами:
 * `label_key`: Ключ для текстовой метки ссылки в объекте `strings` для локализации.
 * `url`: Полный URL, на который ведет ссылка.
 * `icon`: Название иконки Material Symbols. Если `customIconUrl` указан, `icon` игнорируется.
 * `customIconUrl`: (Опционально) Путь к пользовательской локальной иконке (SVG, PNG).
 * `order`: Порядок отображения ссылки в списке (меньшие числа идут первыми).
 * `isSocial`: Является ли ссылка социальной сетью (влияет на свайп-жесты и счетчик подписчиков).
 * `showSubscriberCount`: Показывать ли счетчик подписчиков для этой ссылки.
 * `platformId`: Идентификатор платформы (для сопоставления со счетчиками подписчиков из `appData`).
 * `subscribeUrl`: URL для прямой подписки (используется при свайпе вправо).
 * `active`: Активна ли ссылка (если `false`, ссылка не отображается).
 */
export const linksConfig = [
    {
        "label_key": "youtubeChannelLabel",
        "url": "https://www.youtube.com/channel/UCm6mheCT60mZ5qlxG5r2GeA",
        "icon": "play_arrow",
        "order": 1,
        "isSocial": true,
        "showSubscriberCount": true,
        "platformId": "youtube",
        "subscribeUrl": "https://www.youtube.com/channel/UCm6mheCT60mZ5qlxG5r2GeA?sub_confirmation=1",
        "active": true
    },
    {
        "label_key": "telegramChannelLabel",
        "url": "https://t.me/bezzubickmcplay",
        "icon": "send",
        "order": 2,
        "isSocial": true,
        "showSubscriberCount": true,
        "platformId": "telegram",
        "active": true
    },
    {
        "label_key": "instagramProfileLabel",
        "url": "https://www.instagram.com/bezzubickmcplay/",
        "icon": "photo_camera",
        "order": 3,
        "isSocial": true,
        "showSubscriberCount": false, // Пока не конфигурируем
        "platformId": "instagram",
        "active": true
    },
    {
        "label_key": "xTwitterProfileLabel",
        "url": "https://x.com/bezzubickmcplay",
        "icon": "public",
        "order": 4,
        "isSocial": true,
        "showSubscriberCount": false, // Пока не конфигурируем
        "platformId": "x",
        "active": true
    },
    {
        "label_key": "twitchChannelLabel",
        "url": "https://www.twitch.tv/bezzubickmcplay",
        "icon": "live_tv",
        "order": 5,
        "isSocial": true,
        "showSubscriberCount": true,
        "platformId": "twitch",
        "active": true
    },
    {
        "label_key": "tiktokProfileLabel",
        "url": "https://www.tiktok.com/@bezzubickmcplay",
        "icon": "music_note",
        "order": 6,
        "isSocial": true,
        "showSubscriberCount": false, // Пока не конфигурируем
        "platformId": "tiktok",
        "active": true
    },
    {
        "label_key": "vkGroupLabel",
        "url": "https://vk.com/bezzubickmcplay",
        "icon": "group",
        "order": 7,
        "isSocial": true,
        "showSubscriberCount": true,
        "platformId": "vk_group", // Идентификатор для группы ВК
        "active": true
    },
    {
        "label_key": "vkPersonalPageLabel",
        "url": "https://vk.com/bezzubickmcplay_official",
        "icon": "person",
        "order": 8,
        "isSocial": true,
        "showSubscriberCount": true,
        "platformId": "vk_personal", // Идентификатор для личной страницы ВК
        "active": true
    },
    {
        "label_key": "myPortfolioLabel",
        "url": "https://example.com/portfolio",
        "icon": "folder_open",
        "order": 9,
        "isSocial": false,
        "showSubscriberCount": false, // Это не социальная сеть, счетчик не нужен
        "active": true
    },
    {
        "label_key": "hiddenLinkExample",
        "url": "https://example.com/hidden",
        "icon": "visibility_off",
        "order": 10,
        "isSocial": false,
        "showSubscriberCount": false,
        "active": false // Эта ссылка не будет отображаться
    },
    {
        "label_key": "localIconExample",
        "url": "https://example.com/custom-local",
        "icon": "",
        "customIconUrl": "./assets/custom_icon.svg", // Пример: укажите путь к вашему SVG/PNG файлу иконки
        "order": 11,
        "isSocial": false,
        "showSubscriberCount": false,
        "active": true
    }
];
