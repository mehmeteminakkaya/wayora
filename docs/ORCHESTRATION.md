# Agent Orchestration

Wayora'da birden fazla agent'ı aynı anda çalıştırırken çakışmayı önlemenin ve kaliteyi
artırmanın yolu **izolasyon + açık roller + kanıt**tır.

## 1. İzolasyon: git worktree

Her paralel görev kendi worktree'sinde ve kendi branch'inde çalışır. Aynı dosyaya iki agent
dokunmaz.

```bash
# Tek komutla yeni worktree (script)
node scripts/new-worktree.mjs w-42-budget

# Elle
git worktree add ../wayora-w-42 -b feat/W-42-budget
git worktree list
```

Kurallar:

- Worktree başına **tek sorumluluk** (tek story).
- Ortak dosyalar (`api/src/app.ts`, `web/src/App.tsx`, `package.json`) için önceden sıra belirle;
  iki agent aynı anda düzenlemesin.
- Merge sırası: önce altyapı/DB, sonra API, sonra UI.
- İş bitince `git worktree remove ../wayora-w-42`.

Script `scripts/new-worktree.mjs`, branch varsa onu kullanır; yoksa `main`'den açar.

## 2. Roller

| Rol | Girdi | Çıktı | Kısıt |
| :--- | :--- | :--- | :--- |
| **Explorer** | Spec + repo | Dosya haritası, riskler | Kod yazmaz |
| **Planner** | Explorer çıktısı | Adım listesi, test planı | Kod yazmaz |
| **Generator** | Plan | Kod + test | Yalnızca kendi worktree'si |
| **Critic** | Diff + spec | `ACCEPT` / `REVISE` + bulgular | Kodu değiştirmez |
| **Integrator** | Onaylı diff | Merge + changelog | `main`'e doğrudan push yok |

Critic, generator ile **aynı oturumda** olmamalı; bağımsız bağlam daha iyi hata yakalar.

## 3. Generator–critic döngüsü

```text
1. Generator: planı uygular, testleri çalıştırır.
2. Critic: `.agents/skills/wayora-review` ile diff'i inceler.
3. Critic: SEVERE/MAJOR varsa REVISE + dosya:satır listesi.
4. Generator: yalnızca belirtilen bulguları düzeltir.
5. En az 2 tur; critic ACCEPT diyene kadar.
6. İnsan: son diff'i ve test kanıtını onaylar.
```

Örnek tur kaydı:

```text
Tur 1: Critic: REVISE
- [MAJOR] api/src/routes/trips.ts:210: generate sırasında `status` hata yolunda 'failed'
  kalmıyor; try/catch dışında update var mı doğrula.
- [MINOR] web/src/pages/TripDetailPage.tsx:88: buton metni "Planı yeniden üret" sabit;
  plan yokken "AI ile plan oluştur" olmalı.

Tur 2: Generator: düzeltildi + test eklendi.
Critic: KARAR: ACCEPT
```

## 4. Autonomy seviyeleri

| Seviye | Agent ne yapabilir? | Ne zaman |
| :--- | :--- | :--- |
| L0 | Sadece okur/önerir | Keşif, mimari karar |
| L1 | Önerilen diff'i yazar, uygulamaz | Riskli refactor |
| L2 | Kendi worktree'sinde kod + test yazar | Varsayılan geliştirme |
| L3 | Test/CI yeşilse PR açar | Olgun, iyi test edilmiş alan |
| L4 | Otomatik merge | **Wayora'da kullanılmaz** |

İnsan onayı olmadan `main`'e merge yok. L3'te bile PR açıklaması ve test kanıtı zorunlu.

## 5. Subagent pattern'leri

- **Paralel keşif:** İki explorer, API ve web'i ayrı ayrı haritalar; sonuçlar planner'da birleşir.
- **Paralel uygulama:** Bağımsız story'ler (ör. "bütçe özeti" + "boş durum ekranı") ayrı worktree.
- **Critic ayrımı:** Uygulayan agent'a review yaptırma; yeni bir critic oturumu aç.
- **Escalation:** Critic 2 turda çözemiyorsa insan devralır; agent döngüyü zorlamaz.

## 6. Çakışma kontrol listesi

- [ ] Her agent kendi worktree'sinde mi?
- [ ] Branch adları `feat/W-xx-...` mi?
- [ ] Migration ekleyen tek bir agent mı var?
- [ ] `package-lock.json` iki yerde değişti mi? (Tek agent sorumlu.)
- [ ] Aynı test dosyası iki worktree'de değişiyor mu?
- [ ] Merge öncesi `git rebase main` + tüm testler?
