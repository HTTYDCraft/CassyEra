// config.js — главный конфигурационный файл

export const appConfig = {
    dataUrl: "../data.json",       // путь к файлу с динамическими данными (счётчики, видео)
    showLiveStreamSection: false,  // показывать ли блок с прямым эфиром
    showProfileSection: true,      // показывать ли блок «профиль» (аватар, имя, описание)
    showMinecraftSkinSection: true,// показывать ли блок с Minecraft-скином
    showLinksSection: true,        // показывать ли блок ссылок
    showYouTubeVideosSection: false,// показывать ли блок с видео YouTube
    showSupportButton: true,       // показывать ли кнопку поддержки
    supportUrl: ""                 // 👈 сюда вставить URL для донатов/поддержки
};

export const profileConfig = {
    name_key: "profileName",                 // ключ для имени профиля (из strings.js)
    description_key: "profileDescription",   // ключ для описания профиля (из strings.js)
    avatar: "./assets/avatar.png",           // путь к аватарке
    minecraftSkinUrl: "./assets/skin.png"    // путь к Minecraft‑скину
};

export const linksConfig = [
    // Здесь настраиваются все ссылки, которые будут отображаться на странице.
    // label_key - ключ из файла strings.js для названия ссылки.
    // url - сама ссылка.
    // icon - название иконки из Google Material Symbols.
    // customIconUrl - если нужна своя иконка (например, для Discord), укажите путь к ней здесь.
    // order - порядок отображения.
    // showSubscriberCount - показывать ли счётчик (требует настройки API). Сейчас отключено.
    // platformId - уникальный ID для API.

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
        label_key: "telegramLabel",
        url: "",
        icon: "send",
        order: 1,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "telegram",
        active: true
    },
    {
        label_key: "tiktokLabel",
        url: "",
        icon: "music_note",
        order: 2,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "tiktok",
        active: true
    },
    {
        label_key: "vkLabel",
        url: "",
        icon: "group",
        order: 3,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "vk",
        active: true
    },
    {
        label_key: "discordLabel",
        url: "",
        // Для Discord нет стандартной иконки, поэтому используем свою.
        // Нужно будет положить файл discord-icon.svg в папку assets.
        customIconUrl: "./assets/discord-icon.svg",
        order: 4,
        isSocial: true,
        showSubscriberCount: false,
        platformId: "discord",
        active: true
    },
    // Можно добавить ещё ссылок по этому же шаблону.
];