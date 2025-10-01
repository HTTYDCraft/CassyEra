// config_en.js — application configuration (skeleton with placeholders)

export const appConfig = {
    dataUrl: "../data.json", // путь к основному JSON-файлу данных
    showLiveStreamSection: true,   // показывать ли блок с прямым эфиром
    showProfileSection: true,      // показывать ли блок «профиль»
    showMinecraftSkinSection: true,// показывать ли блок с Minecraft-скином
    showLinksSection: true,        // показывать ли блок ссылок
    showYouTubeVideosSection: true,// показывать ли блок с видео YouTube
    showSupportButton: true,       // показывать ли кнопку поддержки
    developmentMode: true,         // включён ли режим разработки
    showDevToggle: true,           // показывать ли переключатель «Dev Mode»
    showLanguageToggle: true,      // показывать ли переключатель языков
    showThemeToggle: true,         // показывать ли переключатель темы
    supportUrl: "" // 👈 сюда вставить свой реальный URL для донатов/поддержки
};

export const profileConfig = {
    name_key: "profileName",                 // ключ для имени профиля (из i18n JSON)
    description_key: "profileDescription",   // ключ для описания профиля
    avatar: "./assets/avatar.png",           // путь к аватарке (заменить на свой файл)
    minecraftSkinUrl: "./assets/skin.png"    // путь к Minecraft‑скину
};

export const linksConfig = [
    {
        label_key: "youtubeChannelLabel",    // ключ для подписи (YouTube)
        url: "",                             // сюда вставить ссылку на YouTube‑канал
        icon: "play_arrow",                  // иконка YouTube
        order: 1,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "youtube",
        subscribeUrl: "",                    // сюда вставить ссылку для подписки с ?sub_confirmation=1
        active: true
    },
    {
        label_key: "telegramChannelLabel",   // подпись Telegram
        url: "",                             // сюда вставить ссылку на ваш Telegram
        icon: "send",
        order: 2,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "telegram",
        active: true
    },
    {
        label_key: "twitchChannelLabel",     // подпись Twitch
        url: "",                             // сюда вставить ссылку на Twitch-канал
        icon: "live_tv",
        order: 3,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "twitch",
        active: true
    },
    {
        label_key: "tiktokProfileLabel",     // подпись TikTok
        url: "",                             // сюда вставить ссылку на TikTok‑профиль
        icon: "music_note",
        order: 4,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "tiktok",
        active: true
    },
    {
        label_key: "instagramProfileLabel",  // подпись Instagram
        url: "",                             // сюда вставить ссылку на Instagram‑профиль
        icon: "photo_camera",
        order: 5,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "instagram",
        active: true
    },
    {
        label_key: "xTwitterProfileLabel",   // подпись X (бывший Twitter)
        url: "",                             // сюда вставить ссылку на профиль X/Twitter
        icon: "public",
        order: 6,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "x",
        active: true
    },
    {
        label_key: "vkGroupLabel",           // подпись VK‑группа
        url: "",                             // сюда вставить ссылку на группу ВКонтакте
        icon: "group",
        order: 7,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "vk_group",
        active: true
    },
    {
        label_key: "vkPersonalPageLabel",    // подпись VK‑личная страница
        url: "",                             // сюда вставить ссылку на вашу страницу ВКонтакте
        icon: "person",
        order: 8,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "vk_personal",
        active: true
    }
];