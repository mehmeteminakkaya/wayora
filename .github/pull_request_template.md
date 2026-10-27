## Ne değişti?

<!-- Kısaca. Story: W-xx · Spec: docs/specs/001-mvp/spec.md#us-x -->

## Neden?

<!-- Problem / kullanıcı ihtiyacı. Spec'te hangi kabul kriterine denk geliyor? -->

## Yaklaşım

<!-- Teknik özet, önemli kararlar ve tradeoff'lar. -->

## Nasıl test edildi?

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` geçiyor
- [ ] Yeni davranış için başarı + hata testi eklendi
- [ ] API'de / tarayıcıda elle denendi (adımlar aşağıda)

```text
1.
2.
```

## Ekran görüntüsü (UI değişikliyse)

<!-- Önce / sonra -->

## AI review

- Kullanılan araç: <!-- CodeRabbit / Graphite / Copilot / yok -->
- AI bulguları: <!-- SEVERE/MAJOR/MINOR sayısı -->
- Triage: <!-- hangileri kabul edildi, hangileri reddedildi ve neden -->
- AI'ın kaçırdığı: <!-- en az bir şey -->

## Kontrol listesi (Definition of Done: docs/TEAM.md)

- [ ] Kabul kriterleri sağlanıyor
- [ ] PR küçük ve tek konuya odaklı (< ~400 satır)
- [ ] Yeni mantık için test eklendi; hata yolları kapsandı
- [ ] Gerekiyorsa `docs/` ve `AGENTS.md` güncellendi
- [ ] Gizli anahtar / `.env` commit'lenmedi
- [ ] Yetki kontrolü: başka kullanıcının kaynağı 404 dönüyor
- [ ] LLM değişikliyse prompt injection ve fallback testi var
- [ ] Erişilebilirlik: label, klavye, `aria-label`, kontrast

## Risk / geri alma

<!-- Bilinen risk, izlenecek metrik, gerekirse revert planı. -->
