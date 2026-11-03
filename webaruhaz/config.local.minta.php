<?php
// MINTA – másolja le config.local.php néven, írja be a címeket, és csak a tárhelyre töltse fel (GitHubra ne!).
// A tulajdonosok e-mail címei: ide küldi a rendszer a belépési kódot.
return [
  // ügyféllista titkosító kulcsa: 32 véletlen bájt base64-ben, pl.  php -r "echo base64_encode(random_bytes(32));"
  'kulcs' => '',
  // Online bankkártyás fizetés (Barion). A kulcsot a Barion fiókban, a webshop (POS) beállításainál találja.
  // 'teszt' => true: a Barion tesztrendszere, valódi pénz nem mozog. Élesítéskor állítsa false-ra, és írja be az éles POSKey-t.
  'barion' => [
    'poskey' => '',          // a webshop titkos kulcsa (POSKey)
    'payee'  => '',          // a Barion fiók e-mail címe, ide érkezik a pénz
    'teszt'  => true,
  ],
  // a webáruház pontos címe (a fizetés utáni visszairányításhoz), pl. https://penztar-gep.hu/webaruhaz
  'oldal' => '',
  'emails' => [
    'kucsera-istvan'     => '',   // Kucsera István
    'ifj-kucsera-istvan' => '',   // Ifj. Kucsera István
    'kucsera-balazs'     => '',   // Kucsera Balázs
  ],
];
