<?php
// MINTA – másolja le config.local.php néven, írja be a címeket, és csak a tárhelyre töltse fel (GitHubra ne!).
// A tulajdonosok e-mail címei: ide küldi a rendszer a belépési kódot.
return [
  // ügyféllista titkosító kulcsa: 32 véletlen bájt base64-ben, pl.  php -r "echo base64_encode(random_bytes(32));"
  'kulcs' => '',
  'emails' => [
    'kucsera-istvan'     => '',   // Kucsera István
    'ifj-kucsera-istvan' => '',   // Ifj. Kucsera István
    'kucsera-balazs'     => '',   // Kucsera Balázs
  ],
];
