// Two languages: English at the plain paths, French under /fr. The language is read from the URL, so pages
// need no prop and /fr/<path> can render the same view as /<path>.
export type Lang = "en" | "fr";

export const getLang = (url: URL): Lang => (/^\/fr(\/|$)/.test(url.pathname) ? "fr" : "en");

/** English path of the current page ("/fr/cv/" -> "/cv/"). */
export const basePath = (pathname: string) => pathname.replace(/^\/fr(?=\/|$)/, "") || "/";

/** Link to an English path ("/cv") in the given language. */
export const localePath = (lang: Lang, path: string) => (lang === "fr" ? (path === "/" ? "/fr/" : `/fr${path}`) : path);

/** The same page in the other language. */
export const altPath = (lang: Lang, pathname: string) =>
    lang === "fr" ? basePath(pathname) : localePath("fr", pathname);

export const dateLocale = (lang: Lang) => (lang === "fr" ? "fr-CH" : "en-CH");

/** Shared strings (nav, footer, labels used on several pages). Page-specific text lives in the page's view. */
export const ui = {
    en: {
        tagline: "Senior AI Engineer",
        description: "Loïs Bilat – Senior Data & AI Engineer",
        home: "Home",
        cv: "CV",
        projects: "Projects",
        collections: "Collections",
        blog: "Blog",
        profile: "Profile",
        menu: "Toggle menu",
        language: "Language",
        tvShows: "TV Shows",
        races: "Races",
        vinyls: "Vinyls",
        boardGames: "Board Games",
        videoGames: "Video Games",
        teas: "Teas",
        viewAll: "View all",
        back: "All posts",
        englishOnly: "This article is only available in English.",
    },
    fr: {
        tagline: "Ingénieur IA senior",
        description: "Loïs Bilat – Ingénieur Data & IA senior",
        home: "Accueil",
        cv: "CV",
        projects: "Projets",
        collections: "Collections",
        blog: "Blog",
        profile: "Profil",
        menu: "Afficher le menu",
        language: "Langue",
        tvShows: "Séries TV",
        races: "Courses",
        vinyls: "Vinyles",
        boardGames: "Jeux de société",
        videoGames: "Jeux vidéo",
        teas: "Thés",
        viewAll: "Tout voir",
        back: "Tous les articles",
        englishOnly: "Cet article n'est disponible qu'en anglais.",
    },
} as const;
