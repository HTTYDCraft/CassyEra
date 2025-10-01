
export const homeConfigRu = {
    links: {
        linksPageUrl: "",          // ссылка на страницу со всеми ссылками
        youtubeChannelUrl: "",     // основная ссылка на YouTube‑канал
        youtubeSubscribeUrl: "",   // ссылка для подписки на канал (с sub_confirmation)
        supportUrl: "",            // ссылка для поддержки (донаты)
        telegramUrl: "",           // ссылка на Telegram‑канал или чат
        contactEmail: ""           // контактный e‑mail
    },

    ui: {
        navTitle: "",          // заголовок блока навигации
        navDesc: "",           // описание перехода на страницу ссылок
        navCta: "",            // текст кнопки перехода к ссылкам
        skinTitle: "",         // заголовок блока со скином Minecraft
        skinDownload: "",      // подпись кнопки «скачать скин»
        videosTitle: "",       // заголовок блока последних видео
        twitchAlso: "",        // подпись о том, что трансляция идёт и на Twitch
        twitchCta: "",         // текст кнопки «смотреть на Twitch»
        followersLabel: "",    // подпись для отображения числа подписчиков
        timelineTitle: ""      // заголовок ленты/таймлайна
    },

    texts: {
        heroTagline: "",       // короткий слоган в шапке сайта

        aboutIntroMd: "",      // вступительный блок (Markdown before timeline)

        timeline: [            // список объектов по годам (лента событий)
            {
                year: "",      // год
                title: "",     // заголовок события/этапа
                bodyMd: ""     // описание события в формате Markdown
            }
        ],

        aboutOutroMd: ""       // завершающий блок «о канале», интересы, комьюнити
    }
};