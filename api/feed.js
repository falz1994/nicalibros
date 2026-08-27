// Feed de productos para Facebook Commerce Manager (formato catálogo de Meta)
// URL pública: https://nicalibros.vercel.app/api/feed
// Lee en vivo desde Supabase (vista pública catalogo_publico) — siempre actualizado.

const SUPABASE_URL = 'https://nsgysypegqvntlxndsaa.supabase.co';
const PUB = 'sb_publishable_4znJSfRiJYpVGpALgOCWGg_q0Gz5jdx';
const SITE = 'https://nicalibros.vercel.app';

function csvEscape(v) {
  if (v == null) return '';
  v = String(v).replace(/"/g, '""');
  return /[",\n\r]/.test(v) ? '"' + v + '"' : v;
}

module.exports = async (req, res) => {
  try {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/catalogo_publico?select=*&order=id',
      { headers: { apikey: PUB } }
    );
    if (!r.ok) throw new Error('Supabase ' + r.status);
    const libros = await r.json();

    const cols = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand'];
    const lines = [cols.join(',')];
    for (const l of libros) {
      if (l.precio == null) continue; // Facebook exige precio
      const precioPublico = Math.ceil((l.precio + 50) / 50) * 50; // misma regla del sitio
      const desc = `${l.titulo}${l.autor ? ' — ' + l.autor : ''}. ${l.genero ? 'Género: ' + l.genero + '. ' : ''}Entrega a domicilio en la zona centro de Managua: C$100.`;
      lines.push([
        l.id,
        l.titulo,
        desc,
        'in stock',
        'new',
        `${precioPublico}.00 NIO`,
        SITE + '/',
        l.portada || '',
        l.autor || 'Nicalibros',
      ].map(csvEscape).join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send('\uFEFF' + lines.join('\n'));
  } catch (e) {
    res.status(500).send('Error generando feed: ' + e.message);
  }
};
