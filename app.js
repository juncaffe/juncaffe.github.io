/**
 * Pockee 랜딩 동작 스크립트.
 *
 * 언어 판정은 head 인라인 스크립트(window.PockeeLang)가 이미 끝낸 상태로 넘어온다.
 * 이 파일은 넘겨받은 언어로 텍스트·링크·메타·배너를 갱신하고 클릭 트래킹을 붙인다.
 * 문구와 언어 데이터는 i18n.js에 있다.
 */
const PLAY_STORE_BASE = 'https://play.google.com/store/apps/details?id=com.juncaffe.pockee';
const SITE_URL = 'https://pockee.app/';

function normalizeLanguage(lang) {
    return window.PockeeLang.normalize(lang);
}

function getCurrentLanguage() {
    return window.POCKEE_CURRENT_LANG || window.POCKEE_INITIAL_LANG || window.PockeeLang.detect();
}

function getHeroBanner(lang) {
    return HERO_BANNER[lang] || DEFAULT_HERO_BANNER;
}

function getPockeeFxUrl(lang) {
    return `./calculator/calculator.html?lang=${lang}`;
}

function getPlayStoreUrl(position, lang) {
    const referrer = new URLSearchParams({
        utm_source: 'pockee_landing',
        utm_medium: 'web',
        utm_campaign: 'landing_page',
        utm_content: position || 'unknown',
        utm_term: lang || 'en'
    }).toString();

    return `${PLAY_STORE_BASE}&referrer=${encodeURIComponent(referrer)}`;
}

function updateTrackedLinks(lang) {
    document.querySelectorAll('[data-track="play_store_click"]').forEach(link => {
        link.setAttribute('href', getPlayStoreUrl(link.dataset.position || 'unknown', lang));
    });

    const fxUrl = getPockeeFxUrl(lang);
    document.querySelectorAll('[data-track="fx_page_click"]').forEach(link => {
        link.setAttribute('href', fxUrl);
    });
}

function pushTrackingEvent(eventName, params = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: eventName,
        source: params.source || 'pockee_landing',
        page: params.page || 'landing',
        lang: params.lang || getCurrentLanguage(),
        position: params.position || 'unknown'
    });
}

function initClickTracking() {
    document.querySelectorAll('[data-track]').forEach(element => {
        element.addEventListener('click', () => {
            pushTrackingEvent(element.dataset.track, {
                source: element.dataset.source,
                page: element.dataset.page,
                position: element.dataset.position,
                lang: getCurrentLanguage()
            });
        });
    });
}

function setMeta(name, content) {
    let element = document.querySelector(`meta[name="${name}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}

function setPropertyMeta(property, content) {
    let element = document.querySelector(`meta[property="${property}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}

function updateStructuredData(lang, meta) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Pockee',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Android',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        url: SITE_URL,
        downloadUrl: getPlayStoreUrl('structured_data', lang),
        description: meta.description
    };

    const element = document.getElementById('structuredData');
    if (element) {
        element.textContent = JSON.stringify(structuredData, null, 2);
    }
}

function updateMeta(lang) {
    const meta = PAGE_META[lang] || PAGE_META.en;

    document.documentElement.lang = meta.langAttr;
    document.title = meta.title;
    setMeta('description', meta.description);
    setMeta('keywords', meta.keywords);
    setPropertyMeta('og:title', meta.ogTitle);
    setPropertyMeta('og:description', meta.ogDescription);
    setMeta('twitter:title', meta.ogTitle);
    setMeta('twitter:description', meta.ogDescription);

    updateStructuredData(lang, meta);
}

function renderLanguage(lang) {
    const nextLang = normalizeLanguage(lang) || window.PockeeLang.detect();
    window.POCKEE_CURRENT_LANG = nextLang;

    const dictionary = I18N[nextLang] || I18N.en;

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (dictionary[key]) {
            element.textContent = dictionary[key];
        }
    });

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = nextLang;
    }

    updateTrackedLinks(nextLang);

    const heroImage = document.getElementById('heroImage');
    if (heroImage) {
        heroImage.setAttribute('src', getHeroBanner(nextLang));
        heroImage.setAttribute('alt', dictionary.imageAlt || I18N.en.imageAlt);
    }

    updateMeta(nextLang);
}

function init() {
    renderLanguage(getCurrentLanguage());

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', event => {
            renderLanguage(event.target.value);
        });
    }

    initClickTracking();
}

init();
