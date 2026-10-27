---
name: wayora-security
description: Wayora'da auth, LLM, girdi işleme, bağımlılık veya deploy değişikliği yaparken güvenlik kontrol listesini uygular.
---

# Wayora Security Checklist

## Girdi ve yetki

- [ ] Tüm gövde/parametreler zod ile doğrulanıyor.
- [ ] Korumalı route'larda `requireAuth` var.
- [ ] Sorgularda `userId` filtresi var; başkasının kaynağı 404.
- [ ] Dosya yolu / URL / redirect girdileri beyaz listeye göre işleniyor.
- [ ] Hata mesajı iç sistem detayı (stack, SQL, anahtar) sızdırmıyor.

## LLM ve prompt injection

- [ ] Kullanıcı metni `<untrusted_user_notes>` içinde ve "veri" olarak işaretli.
- [ ] LLM çıktısı zod ile doğrulanıyor; aday dışı yer kimlikleri atılıyor.
- [ ] Toplam maliyet ve iş kuralları sunucuda yeniden hesaplanıyor.
- [ ] Prompt/yanıt loglanırken kişisel veri ve anahtar maskeleniyor.
- [ ] Sağlayıcı hatasında güvenli fallback var; kullanıcıya ham hata gösterilmiyor.

## Sırlar ve bağımlılıklar

- [ ] `.env` commit'lenmemiş; `.env.example` güncel ve gerçek anahtar içermiyor.
- [ ] `npm audit --audit-level=high` temiz veya risk kabulü belgelenmiş.
- [ ] Yeni bağımlılık: bakım durumu, lisans, indirme boyutu kontrol edildi.
- [ ] CI'da gitleaks/secret scan ve CodeQL çalışıyor.

## Kötüye kullanım

- [ ] Auth ve AI endpoint'lerinde rate limit var.
- [ ] AI üretimi kullanıcı başına günlük limitle sınırlı.
- [ ] CORS yalnızca izinli origin'lere açık; `credentials` ile birlikte wildcard yok.
- [ ] Cookie `httpOnly`, `sameSite=lax`, production'da `secure`.

## Doğrulama

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm audit --audit-level=high
npx gitleaks detect --no-git   # veya CI sonucu
```
