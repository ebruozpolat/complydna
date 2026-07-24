# ComplyDNA — Ürün Felsefesi

> Neden daha fazla veri için değil, daha az iş için geliştiriyoruz.

*Dil: **Türkçe** · [English](./philosophy.md)*

Bu doküman, ComplyDNA'nın üzerine kurulduğu inancı ortaya koyar.
[`complydna-dev-plan.md`](./complydna-dev-plan.md) içindeki her şey — kaynak
künyeli yanıtlar, gereksiz inceleme yükünü ortadan kaldırmak, sürümlenen golden
set değerlendirmeleri — bu inançtan doğar. Önerilen bir özellik bu teze hizmet
etmiyorsa, üründe yeri yoktur.

---

## Uyum araçlarının metalaşması

Uyum araçları — KYC kontrolleri, yaptırım taraması, dolandırıcılık tespiti,
blokzincir izleme — bir emtiaya (commodity) dönüşüyor. Bu da onların çoğunlukla
fiyat üzerinden rekabet etmek zorunda olduğu anlamına geliyor.

FinTech sektörü için ne yazık ki, bu hizmet sağlayıcıların birçoğu "farklılaşmak"
için ek bilgi, daha fazla detay, daha gelişmiş analitik ya da daha zengin
raporlama sunmaya karar verdi — bunun sayesinde biraz daha fazla ücret alıp öne
çıkacaklarını umarak. Bunun orta vadede bile işe yarayacağını düşünmüyorum.

Süreçleri otomatikleştirip uyum ekiplerine zaman kazandırmak yerine, bu
"veriyle zenginleştirilmiş araçlar" yalnızca daha fazla iş üretiyor: incelenecek,
değerlendirilecek ve elenecek daha fazla veri noktası. Bu ek noktaların büyük
çoğunluğu hiçbir şeyi değiştirmiyor.

Herhangi bir FinTech'in içindeki en büyük uyum verimsizliklerinden biri,
müşterinin hesap durumunda hiçbir değişikliğe yol açmayan gereksiz alarmların ve
yanlış pozitiflerin manuel incelemesinde harcanan zamandır. Dolayısıyla, uyum
ekibine zaman kazandırmak yerine daha fazla iş üreten her araç ters etki yapar ve
— bana kalırsa — yatırıma değmez.

## Ekipler neden sürekli daha fazla veri istiyor

Uyum çalışanları, sağlayıcılarına daha fazla veri, daha iyi raporlama ya da daha
derin analitik gerektiğini birkaç yinelenen sebeple söyler. Her birinde dürüst
olmakta fayda var.

- **Mesleki refleks.** Mesleğimizin bilgiye derin bir saygısı var; bu yüzden daha
  fazla verinin iyi olduğuna otomatik olarak inanırız. Ama daha fazla bilgi, daha
  hızlı kararlar ya da daha az gereksiz süreç anlamına gelmez. Genellikle tam
  tersi olur — belgelenecek ve mutabakatı sağlanacak daha çok veri noktası
  yüzünden *daha yavaş* kararlar.

- **"İlginç" olması.** Birçok uyum çalışanı gizliden gizliye polisçilik oynamaktan
  ve kötü adamları yakalamayı hayal etmekten hoşlanır. Daha derine inmeyi,
  müşterinin anlatısındaki "sulu detayları" veya tutarsızlıkları aramayı severiz.
  Dürüst olalım: bu kişisel bir keyif, olmazsa olmaz bir ihtiyaç değil.

- **Bir kalkan olarak kesinlik.** Uyum çalışanları kesinliği sever, riskten
  kaçınır ve kararları konusunda güvende hissetmek ister. Biraz eksik bilgiyle
  karar vermekten rahatsız olduğumuzda, kararı ertelemeyi — "ek araştırma
  gerekiyor" — ya da kişisel sorumluluktan kaçınmak için bir komiteye taşımayı
  tercih ederiz. Ek veri noktaları bir günah keçisine, kararı şimdi vermemek için
  elverişli bir bahaneye dönüşür.

Bunların hiçbiri bir ürünün etrafında kurgulanacağı gerekçeler değil. Bunlar, bir
ürünün karşı koyacak şekilde tasarlanması gereken şeyler.

## RegTech aslında ne işe yarar

Şuna güçlü bir inancım var: RegTech'in — ve uyum odaklı her SaaS'ın — amacı:

1. **Süreç otomasyonu** ve sektöre verimlilik getirmek.
2. **Müşteri deneyimini hızlandırmak ve iyileştirmek.**
3. **Müşteri başına uyum maliyetini düşürmek.**

Rastgele özellikler, daha fazla veri ve göz önünde bulundurulacak daha fazla öge
eklemek, uyum departmanı için hoş bir Candy Crush ofis oyunudur. RegTech'in
amacıyla hiçbir ilgisi yoktur.

---

## Bu, ComplyDNA'yı nasıl şekillendiriyor

ComplyDNA, Türk mevzuatına (MASAK, 5549, 6415, KVKK, ROM Yönetmeliği) özel bir
uyum LLM ürünüdür. Yukarıdaki tez, somut ürün kurallarına dönüşür:

- **Her cümle bir künye taşır, taşımıyorsa üretilmez.**
  `[LAW-5549 / Madde 4]`. Künyesiz bir iddia bir hata olarak kabul edilir ve bir
  son-kontrol (post-check) tarafından reddedilir. Amaç, inceleyen kişinin *şimdi
  arkasında durabileceği* bir karardır — sonradan mutabakatı sağlanacak daha uzun
  bir dosya değil.

- **Mevzuat sustuğunda, ürün bunu söyler.** "Mevzuatta açık bir hüküm bulamadım"
  geçerli, birinci sınıf bir yanıttır. Boşluğu doldurmak ve inceleme işi yaratmak
  için "ek bağlam" imal etmeyiz.

- **Daha fazlasını gösterip göstermediğimizi değil, zaman kazandırıp
  kazandırmadığımızı ölçeriz.** Golden set, karara götüren sinyali — künye
  precision/recall ve retrieval isabet oranı — takip eder ve gerilemede CI'ı
  başarısız kılar. Daha fazla veri noktası göstermeyi ödüllendiren hiçbir metrik
  yoktur.

- **Hiçbir özellik "ilginç" olduğu için yerini hak etmez.** Bir hesap-durumu
  kararını değiştirmeden incelenecek, değerlendirilecek ve elenecek noktalar
  ekliyorsa, bu tam da bu dokümanın karşısında yazıldığı anti-desendir.

Göndereceğimiz her şeyin sınavı tek bir sorudur: **uyum ekibini savunulabilir bir
karara daha hızlı ulaştırıyor mu, yoksa onlara bakacak daha fazla şey mi
veriyor?**
