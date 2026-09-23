import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDirectory = new URL('../dist/', import.meta.url);
const source = await readFile(new URL('index.html', distDirectory), 'utf8');

// Language entry points live one level below the deployment root. Vite emits
// relative asset URLs, so make those references parent-relative in each copy.
const nestedHtml = source
  .replaceAll('="./', '="../')
  .replaceAll("='./", "='../")
  .replaceAll("'./", "'../")
  .replaceAll('"./', '"../');

for (const locale of ['pt', 'en']) {
  const routeDirectory = join(fileURLToPath(distDirectory), locale);
  const localizedHtml = locale === 'en'
    ? nestedHtml
      .replace('<html lang="pt-BR">', '<html lang="en">')
      .replace('<title>Danilo Ribeiro | Portfólio Cósmico 3D</title>', '<title>Danilo Ribeiro | 3D Cosmic Portfolio</title>')
      .replaceAll('content="Danilo Ribeiro | Portfólio Cósmico 3D"', 'content="Danilo Ribeiro | 3D Cosmic Portfolio"')
      .replace('content="Portfólio 3D interativo de Danilo Ribeiro — Engenheiro de Software Full-Stack & Creative Developer. Experiência gamificada estilo Bruno Simon desenvolvida com React Three Fiber e física Rapier 3D."', 'content="Danilo Ribeiro’s interactive 3D portfolio — Full-Stack Software Engineer and Creative Developer. A gamified experience built with React Three Fiber and Rapier 3D physics."')
      .replace('<link rel="canonical" href="../pt/" />', '<link rel="canonical" href="../en/" />')
      .replace('content="Explore o universo interativo em 3D de Danilo Ribeiro com física em tempo real, ilhas temáticas, desafios técnicos e projetos full-stack."', 'content="Explore Danilo Ribeiro’s interactive 3D universe with real-time physics, themed islands, technical challenges and full-stack projects."')
      .replace('content="pt_BR"', 'content="en_US"')
    : nestedHtml;
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(join(routeDirectory, 'index.html'), localizedHtml, 'utf8');
}
