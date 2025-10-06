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
        followersLabel: "",    // подпись для отображения числа подписчиков
        timelineTitle: "Таймлайн"      // заголовок ленты/таймлайна
    },

    texts: {
        heroTagline: "",       // короткий слоган в шапке сайта

        aboutIntroMd: "",      // вступительный блок (Markdown)

        hobbiesTitle: "",      // заголовок блока "Хобби"
        hobbiesMd: "",         // текст о хобби (Markdown)

        projectsTitle: "",     // заголовок блока "Проекты"
        projects: [            // список проектов
            // Пример объекта проекта:
            // {
            //     title: "Название Проекта",
            //     bodyMd: "Описание проекта...",
            //     button: {
            //         text: "Кнопка",
            //         url: "https://..."
            //     }
            // }
        ],

        timeline: [            // список объектов по годам (лента событий)
            // Пример объекта таймлайна:
            // {
            //     year: "2024",
            //     title: "Событие",
            //     bodyMd: "Описание события..."
            // }
        ],

        aboutOutroMd: ""       // завершающий блок «о канале», интересы, комьюнити (Markdown)
    }
};