# ETALON ÁLLAPOT – 2026. november 5. (2. változat, 16:40)

Ez a penztar-gep.hu „Etalon állapota”: a független szakértői átvizsgálás után kijavított, élesített,
mind a 8 nyelvű, jogi kiegészítéssel ellátott változat, **a pénztárgépenkénti üzembe helyezési díjjal
és gépenkénti adatlappal** (12 gép = 12 díj és 12 adatlap). Ha a tulajdonos azt kéri, hogy
„állítsd vissza az etalonra”, ide kell visszaállítani a rendszert.

## Mi tartozik az Etalonhoz
| Rész | Hol van |
|---|---|
| Program (teljes forráskód) | GitHub: `etalon` ág és `etalon-2026-11-05-v2` címke (kucserabalazs/penztar-gep) |
| A teljes git-történet | a Mac-en: `Downloads/Penztar-gep.hu/ETALON_2026-11-05_v2/penztar-gep_teljes-tortenet.bundle` |
| Forráskód zip | a Mac-en: `…/ETALON_2026-11-05_v2/penztar-gep_forraskod_etalon.zip` |
| Tárhely-adatok (termékek, rendelések, ügyfelek, admin, beállítások, feltöltött képek, config.local.php) | a tárhelyen: `webaruhaz/data/mentesek/ETALON-2026-11-05-v2/`, és a Mac-en: `…/ETALON_2026-11-05_v2/tarhely-adatok/` |

A korábbi (1.) Etalon megmaradt: címke `etalon-2026-11-05`, tárhely `mentesek/ETALON-2026-11-05/`,
Mac `ETALON_2026-11-05/` – csak akkor kell, ha kifejezetten arra kérik a visszaállítást.

## Visszaállítás (ezt Claude végzi el, ha szólsz)
1. **Program:** a `main` ágat az `etalon` ágra kell állítani és feltolni
   (`git checkout main && git reset --hard origin/etalon && git push --force-with-lease origin main`).
   A feltöltés (feltoltes.yml) magától lefut, és élesíti.
2. **Adatok:** GitHub › Actions › „Tárhely adatainak visszaállítása” › Run workflow,
   mentés neve: `ETALON-2026-11-05-v2`, megerősítés: `VISSZAALLITAS`.
   A munkafolyamat előbb elmenti a mostani állapotot (`ELOTTE-…`), utána visszaírja az Etalon adatait.
3. **Ellenőrzés:** főoldal, webáruház, admin belépés, egy termékoldal, nyelvváltás,
   pénztár oldal több pénztárgéppel (gépenként díj és adatlap).

Ha a GitHub vagy a tárhely nem érhető el, a Mac-en lévő bundle-ből és a `tarhely-adatok` mappából
teljesen újraépíthető (`git clone penztar-gep_teljes-tortenet.bundle penztar-gep`), a fájlok SFTP-n (FileZilla) feltölthetők.
