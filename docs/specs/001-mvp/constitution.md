# Wayora MVP: Anayasa (Constitution)

Bu ilkeler `docs/specs/001-mvp/` altındaki tüm spec, plan ve görevleri bağlar.
Çelişki varsa bu dosya üstündür; değişiklik için açık gerekçe ve ekip onayı gerekir.

## 1. Spec önce gelir

Kullanıcı davranışını değiştiren her iş, önce spec'te bir kabul kriteri olarak tanımlanır.
Kod, spec'in nasıl'ıdır; spec kodun ne'yi ve neden'idir. Belirsizlik varsa varsayım yapma,
spec'i netleştir.

## 2. Test davranışı kanıtlar

Her yeni API route'u ve kullanıcı akışı için otomatik test gerekir. Testler özel uygulamaya
değil, gözlenebilir davranışa bakar. Hata yolları (401, 404, 400, 409, 502) mutlaka test edilir.

## 3. Güvenli varsayılan

- Kimlik doğrulama httpOnly cookie + JWT; şifreler bcrypt ile saklanır.
- Her kaynak sorgusu `userId` ile sınırlandırılır.
- Girdi zod ile doğrulanır; hata biçimi standarttır.
- Sırlar yalnızca ortam değişkenindedir; repoda anahtar yoktur.
- AI çıktısı güvenilmezdir: şema doğrulaması, aday filtresi ve sunucu tarafı hesaplama zorunludur.

## 4. Anahtarsız çalışabilirlik

Demo ve geliştirme, harici API anahtarı olmadan uçtan uca çalışmalıdır. LLM `offline`
sağlayıcısı ve yerleşik şehir kataloğu bu yüzden varsayılandır. Gerçek sağlayıcılar
opsiyonel yükseltmedir; yokluğu uygulamayı kırmaz.

## 5. Agent tarafından okunabilirlik

Repo; bir coding agent'ın bağlamı hızlı bulmasını sağlar: kök `AGENTS.md`, alan bazlı
`AGENTS.md`, tekrar kullanılabilir skill'ler, spec/task dosyaları ve deterministik komutlar.
Yeni karmaşıklık eklerken "bir sonraki agent bunu 10 dakikada anlayabilir mi?" sorusunu sor.

## 6. Küçük, geri alınabilir değişiklikler

Her PR tek bir story'yi çözer, küçük ve odaklıdır. Büyük refactor'lar ayrı PR'lardır.
`main` her zaman çalışır; kırık kod merge edilmez.

## 7. Kullanıcı dili ve erişilebilirlik

Ürün metni Türkçedir. Formlar etiketlidir, klavyeyle kullanılabilir, hata mesajları
eyleme dönüktür. Renk tek başına anlam taşımaz.
