import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'tr' | 'en'

const STORAGE_KEY = 'wayora.lang'

const DICT = {
  tr: {
    'nav.explore': 'Keşfet',
    'nav.trips': 'Rotalarım',
    'nav.plan': 'Planla',
    'nav.profile': 'Profil',
    'nav.login': 'Giriş yap',
    'nav.social': 'Yol Arkadaşları',
    'nav.skip': 'İçeriğe geç',
    'nav.home': 'Wayora ana sayfa',

    'landing.kicker': 'SEYAHAT PLANLAMA',
    'landing.title': 'Bir şehir seç. Günlerini Wayora sıralasın.',
    'landing.lead':
      'İlgi alanlarını, bütçeni ve temponu söyle. Wayora şehri günlere, günleri saatlere böler. Planı hazır bırakmaz, düzenlemen için eline verir.',
    'landing.city': 'Şehir',
    'landing.cityPlaceholder': 'Şehir ara: Berlin, Roma, Lizbon...',
    'landing.popular': 'Popüler şehirler',
    'landing.cta': 'Rotanı planla',
    'landing.ctaGuest': 'Planı başlat',
    'landing.stat': '14 şehir · 140 deneyim · ücretsiz',
    'landing.backToTrips': 'Rotalarıma dön',
    'landing.howTitle': 'Nasıl çalışır',
    'landing.step1Title': 'Şehri seç',
    'landing.step1Text': 'Berlin, Roma, Lizbon, Madrid ve daha fazlası. Tarihlerini sen belirle.',
    'landing.step2Title': 'Tercihlerini söyle',
    'landing.step2Text': 'İlgi alanların, bütçen ve tempon üç kısa adımda kaydedilir.',
    'landing.step3Title': 'Planını al',
    'landing.step3Text': 'Wayora günleri saat saat sıralar. İstediğin durağı değiştirirsin.',
    'landing.citiesTitle': 'Şehirler',
    'landing.allCities': 'Tüm şehirler',
    'landing.sampleKicker': 'ÖRNEK PLAN',
    'landing.sampleTitle': 'Örnek bir gün',
    'landing.sampleLead':
      'Wayora bir günü saat saat sıralar: sabah bir müze, öğlen yerel bir pazar, akşamüstü açık hava. Sen sadece şehri, tarihleri ve temponu seçersin.',
    'landing.samplePoint1': 'Gün gün, saat saat plan',
    'landing.samplePoint2': 'Bütçene göre duraklar',
    'landing.samplePoint3': 'İstediğin durağı değiştir',
    'landing.sampleCta': 'Kendi planını oluştur',
    'landing.searchAria': 'Şehir ara',
    'landing.experiences': '10 deneyim',
    'landing.sampleDinner': 'Akşam yemeği · Kreuzberg',
    'landing.sampleDayLabel': 'Berlin için örnek gün planı',
    'landing.sampleDayHead': 'BERLİN / GÜN 01',
    'common.free': 'Ücretsiz',
    'landing.footerAbout': 'Hakkında',
    'landing.footerPrivacy': 'Gizlilik',
    'landing.footerPhotos': 'Fotoğraf kaynakları',
    'landing.footerContact': 'İletişim',

    'auth.loginTitle': 'Giriş yap.',
    'auth.loginSub': 'Rotaların, tercihlerin ve planların hesabında durur.',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.forgot': 'Şifremi unuttum',
    'auth.loginBtn': 'Giriş yap',
    'auth.or': 'veya',
    'auth.google': 'Google ile devam et',
    'auth.noAccount': 'Hesabın yok mu?',
    'auth.createAccount': 'Hesap aç',
    'auth.registerTitle': 'Hesap aç.',
    'auth.registerSub': 'Tercihlerini bir kez seç. Wayora her yeni planda bunları hatırlar.',
    'auth.name': 'Adın (opsiyonel)',
    'auth.namePlaceholder': 'Adın',
    'auth.passwordHint': 'En az 8 karakter. Boşluk ve Türkçe karakter kullanabilirsin.',
    'auth.registerBtn': 'Hesap aç',
    'auth.haveAccount': 'Hesabın var mı?',
    'auth.forgotNotice': 'Şifre sıfırlama henüz yapılandırılmadı.',
    'auth.googleNotice': 'Google girişi henüz yapılandırılmadı.',

    'lang.tr': 'TR',
    'lang.en': 'EN',
  },
  en: {
    'nav.explore': 'Explore',
    'nav.trips': 'My trips',
    'nav.plan': 'Plan',
    'nav.profile': 'Profile',
    'nav.login': 'Log in',
    'nav.social': 'Travel Companions',
    'nav.skip': 'Skip to content',
    'nav.home': 'Wayora home',

    'landing.kicker': 'TRAVEL PLANNING',
    'landing.title': 'Pick a city. Let Wayora plan your days.',
    'landing.lead':
      'Tell us your interests, budget, and pace. Wayora splits the city into days and the days into hours. The plan is yours to edit.',
    'landing.city': 'City',
    'landing.cityPlaceholder': 'Search a city: Berlin, Rome, Lisbon...',
    'landing.popular': 'Popular cities',
    'landing.cta': 'Plan my trip',
    'landing.ctaGuest': 'Start planning',
    'landing.stat': '14 cities · 140 experiences · free',
    'landing.backToTrips': 'Back to my trips',
    'landing.howTitle': 'How it works',
    'landing.step1Title': 'Pick a city',
    'landing.step1Text': 'Berlin, Rome, Lisbon, Madrid and more. You choose the dates.',
    'landing.step2Title': 'Tell your preferences',
    'landing.step2Text': 'Your interests, budget and pace are saved in three short steps.',
    'landing.step3Title': 'Get your plan',
    'landing.step3Text': 'Wayora orders the days hour by hour. Change any stop you want.',
    'landing.citiesTitle': 'Cities',
    'landing.allCities': 'All cities',
    'landing.sampleKicker': 'SAMPLE PLAN',
    'landing.sampleTitle': 'A sample day',
    'landing.sampleLead':
      'Wayora orders a day hour by hour: a museum in the morning, a local market at noon, open air in the afternoon. You only pick the city, the dates and your pace.',
    'landing.samplePoint1': 'Day by day, hour by hour',
    'landing.samplePoint2': 'Stops that fit your budget',
    'landing.samplePoint3': 'Change any stop you want',
    'landing.sampleCta': 'Create your own plan',
    'landing.searchAria': 'Search city',
    'landing.experiences': '10 experiences',
    'landing.sampleDinner': 'Dinner · Kreuzberg',
    'landing.sampleDayLabel': 'Sample day plan for Berlin',
    'landing.sampleDayHead': 'BERLIN / DAY 01',
    'common.free': 'Free',
    'landing.footerAbout': 'About',
    'landing.footerPrivacy': 'Privacy',
    'landing.footerPhotos': 'Photo credits',
    'landing.footerContact': 'Contact',

    'auth.loginTitle': 'Log in.',
    'auth.loginSub': 'Your trips, preferences and plans stay in your account.',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgot': 'Forgot password',
    'auth.loginBtn': 'Log in',
    'auth.or': 'or',
    'auth.google': 'Continue with Google',
    'auth.noAccount': 'No account?',
    'auth.createAccount': 'Create account',
    'auth.registerTitle': 'Create account.',
    'auth.registerSub': 'Set your preferences once. Wayora remembers them for every new plan.',
    'auth.name': 'Your name (optional)',
    'auth.namePlaceholder': 'Your name',
    'auth.passwordHint': 'At least 8 characters. Spaces and Turkish letters are fine.',
    'auth.registerBtn': 'Create account',
    'auth.haveAccount': 'Already have an account?',
    'auth.forgotNotice': 'Password reset is not set up yet.',
    'auth.googleNotice': 'Google login is not set up yet.',

    'lang.tr': 'TR',
    'lang.en': 'EN',
  },
} as const

export type TranslationKey = keyof (typeof DICT)['tr']

type LangContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    // EN, yalnızca menü + giriş/kayıt ekranlarında çevrilmiş durumda; geri kalan
    // sayfaların tamamı (Rotalarım, rota detayı, Keşfet, Yol Arkadaşları, onboarding,
    // profil...) hâlâ sabit Türkçe metin kullanıyor. Kapsam tamamlanana kadar EN
    // düğmesi arayüzde devre dışı (Layout.tsx) ve burada da eski bir 'en' localStorage
    // değeri varsa geri dönülmüyor; aksi hâlde menü İngilizce, sayfa gövdesi Türkçe
    // kalan yarım bir görünüm oluşuyordu.
    return 'tr'
  })

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage yoksa sessizce devam et.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key: TranslationKey) => DICT[lang][key] ?? DICT.tr[key] ?? key, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang yalnızca LanguageProvider içinde kullanılabilir')
  return ctx
}
