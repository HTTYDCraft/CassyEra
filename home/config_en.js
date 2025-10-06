export const homeConfigEn = {
    links: {
        linksPageUrl: "",          // link to the page containing all links
        youtubeChannelUrl: "",     // main YouTube channel URL
        youtubeSubscribeUrl: "",   // subscribe link with sub_confirmation
        supportUrl: "",            // donation/support link
        telegramUrl: "",           // Telegram channel or chat link
        contactEmail: ""           // contact email address
    },

    ui: {
        navTitle: "",          // navigation block title
        navDesc: "",           // description for links page navigation
        navCta: "",            // button text for navigation to links page
        skinTitle: "",         // block title for Minecraft skin
        skinDownload: "",      // caption for "download skin" button
        videosTitle: "",       // title for latest videos block
        followersLabel: "",    // label to display subscriber count
        timelineTitle: ""      // title for channel timeline
    },

    texts: {
        heroTagline: "",       // short tagline in the site header

        aboutIntroMd: "",      // introduction text (Markdown)

        hobbiesTitle: "",      // title for "Hobbies" block
        hobbiesMd: "",         // text about hobbies (Markdown)

        projectsTitle: "",     // title for "Projects" block
        projects: [            // list of projects
            // Example project object:
            // {
            //     title: "Project Name",
            //     bodyMd: "Project description...",
            //     button: {
            //         text: "Button",
            //         url: "https://..."
            //     }
            // }
        ],

        timeline: [            // list of events grouped by year
            // Example timeline object:
            // {
            //     year: "2024",
            //     title: "Event",
            //     bodyMd: "Event description..."
            // }
        ],

        aboutOutroMd: ""       // closing text about channel, interests, community (Markdown)
    }
};