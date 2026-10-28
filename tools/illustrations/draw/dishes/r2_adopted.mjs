// イラスト部 第2回（2026-10-28）で採用した33品。描き方は r2/ の各案（花森 yuzu_r2・白石 nagi_r2・江口 hinata_r2）をそのまま使う
// 採用しなかった案は r2/ に残すだけで、本体の絵には入れない。元の盛りつけは各 dishes/*.mjs から外した
import yuzu from '../r2/yuzu_r2.mjs';
import nagi from '../r2/nagi_r2.mjs';
import hinata from '../r2/hinata_r2.mjs';

const ADOPT = [
    [yuzu, ['br_vinagrete', 'eg_molokhia', 'es_canelones', 'fr_celeri', 'fr_saumon', 'id_karedok', 'id_tumisjamur', 'it_carote', 'it_spinaci', 'pl_seler', 'tr_ispanak']],
    [nagi, ['br_pirao', 'br_pure_batata', 'es_purever', 'in_gujaratidal', 'kabochapotage', 'okayu', 'pe_pure_papa', 'tr_yayla', 'us_mashed']],
    [hinata, ['br_creme_mandioquinha', 'de_champignonsuppe', 'de_spargelcreme', 'es_crema', 'fr_crecy', 'fr_poireaux', 'gb_leekpotato', 'gb_lentil', 'it_passatoverdure', 'mx_crema_calabacita', 'pl_pomidorowa', 'tr_kabak', 'tr_un']],
];
const out = {};
for (const [mod, ids] of ADOPT) for (const id of ids){
    if (!mod[id]) throw new Error(`r2 の案に ${id} がありません`);
    out[id] = mod[id];
}
export default out;
