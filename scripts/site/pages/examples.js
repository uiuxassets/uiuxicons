/**
 * Examples page: static UI patterns (buttons, inputs, cards, lists, alerts)
 * built with the icon set.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { DIST, loadSvg } from '../common.js';
import { layoutSitePage, sharedHeader } from '../templates.js';
import { simplePageScripts } from '../../site-snippets.js';

export async function generateExamples(totalIcons, shared) {
  const { themeIcons, logoIcon, downloadIcon, menuIcon } = shared;
  // Load icons for examples
  const getIcon = async (name, weight = 'regular') => {
    const svg = await loadSvg('line', weight, name);
    return svg || '';
  };
  
  const icons = {
    // Bold for buttons
    filePlusBold: await getIcon('file-plus', 'bold'),
    appWindowBold: await getIcon('app-window', 'bold'),
    xBold: await getIcon('x', 'bold'),
    arrowRightBold: await getIcon('arrow-circle-right', 'bold'),
    // Regular for other UI
    search: await getIcon('search'),
    envelope: await getIcon('envelope'),
    plus: await getIcon('plus'),
    plusCircle: await getIcon('plus-circle'),
    calendar: await getIcon('calendar'),
    target: await getIcon('target'),
    house: await getIcon('house'),
    table: await getIcon('table'),
    gear: await getIcon('gear'),
    filter: await getIcon('filter'),
    archive: await getIcon('archive'),
  };

  const examplesTitle = 'Examples - UI/UX Icons';
  const examplesDescription =
    'UI patterns using UI/UX Icons: buttons, inputs, cards, lists, and alerts. See the library in real interface components.';

  const html = layoutSitePage({
    headOptions: {
      title: examplesTitle,
      description: examplesDescription,
      pageFile: 'examples.html',
    },
    bodyHtml: `  ${sharedHeader('examples', totalIcons, themeIcons, logoIcon, downloadIcon, menuIcon)}

  <main class="max-w-3xl mx-auto px-3 py-6">
    <h1 class="text-3xl font-bold mb-2">Examples</h1>
    <p class="text-fg mb-6">See how icons look in real UI components, made with UI/UX Icons.</p>

    <!-- Buttons Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Buttons</h2>
      <div class="flex flex-wrap gap-3 items-center">
        <!-- Primary Button -->
        <button class="inline-flex items-center justify-center gap-1.5 pl-3 pr-4 py-2 bg-accent text-main rounded-md cursor-pointer hover:bg-accent/90">
          <span class="inline-flex size-4.5">${icons.filePlusBold}</span>
          Create New
        </button>
        
        <!-- Secondary Button -->
        <button class="inline-flex items-center justify-center gap-1.5 pl-3 pr-4 py-2 bg-fg-secondary/20 text-fg rounded-md cursor-pointer hover:bg-fg-secondary/25">
          <span class="inline-flex size-4.5">${icons.appWindowBold}</span>
          Dashboard
        </button>
        
        <!-- Outline Button -->
        <button class="inline-flex items-center justify-center gap-1.5 pl-3 pr-4 py-[calc(0.5rem-1px)] border border-border text-fg rounded-md cursor-pointer hover:bg-fg-secondary/20">
          Continue
          <span class="inline-flex size-4.5">${icons.arrowRightBold}</span>
        </button>
        
        <!-- Icon Only -->
        <button class="inline-flex items-center justify-center px-2.5 py-2.5 border border-border text-fg rounded-md cursor-pointer hover:bg-fg-secondary/20">
          <span class="inline-flex size-4.5">${icons.xBold}</span>
        </button>
      </div>
    </section>

    <!-- Inputs Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Input Fields</h2>
      <div class="space-y-4 max-w-md">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted inline-flex size-5">${icons.search}</span>
          <input type="text" placeholder="Search..." class="w-full pl-9 pr-4 py-2 bg-secondary border border-border hover:border-border-hover focus:border-border-hover rounded-md text-fg placeholder:text-fg-muted focus:outline-none">
        </div>
        
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted inline-flex size-5">${icons.envelope}</span>
          <input type="text" placeholder="Enter your email..." class="w-full pl-9 pr-4 py-2 bg-secondary border border-border hover:border-border-hover focus:border-border-hover rounded-md text-fg placeholder:text-fg-muted focus:outline-none">
        </div>
      </div>
    </section>

    <!-- Cards Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Cards</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-6 bg-fg-secondary/5 rounded-md border border-border cursor-pointer hover:bg-fg-secondary/20">
          <div class="w-10 h-10 bg-accent rounded-md flex items-center justify-center mb-2 text-main">
            <span class="inline-flex size-5">${icons.plusCircle}</span>
          </div>
          <h3 class="font-semibold">Create Project</h3>
          <p class="text-sm text-fg-secondary">Start a new project and invite team members to collaborate.</p>
        </div>
        <div class="p-6 bg-fg-secondary/5 rounded-md border border-border cursor-pointer hover:bg-fg-secondary/20">
          <div class="w-10 h-10 bg-accent rounded-md flex items-center justify-center mb-2 text-main">
            <span class="inline-flex size-5">${icons.calendar}</span>
          </div>
          <h3 class="font-semibold">Schedule Event</h3>
          <p class="text-sm text-fg-secondary">Pick a date and time, then notify everyone on the team.</p>
        </div>
      </div>
    </section>

    <!-- List Items Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">List Items</h2>
      <div class="rounded-md border border-border divide-y divide-border">
        <div class="flex items-center gap-3 p-3 cursor-pointer hover:bg-fg-secondary/20">
          <span class="inline-flex size-5">${icons.house}</span>
          <span>Home</span>
        </div>
        <div class="flex items-center gap-3 p-3 cursor-pointer hover:bg-fg-secondary/20">
          <span class="inline-flex size-5">${icons.table}</span>
          <span>Data Table</span>
        </div>
        <div class="flex items-center gap-3 p-3 cursor-pointer hover:bg-fg-secondary/20">
          <span class="inline-flex size-5">${icons.gear}</span>
          <span>Settings</span>
        </div>
      </div>
    </section>

    <!-- Alert/Badge Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Alerts & Tags</h2>
      <div class="space-y-4">
        <!-- Alert -->
        <div class="flex items-start gap-3 p-4 bg-accent rounded-md text-main">
          <span class="inline-flex size-5 mt-0.5">${icons.target}</span>
          <div>
            <p class="font-medium">New Feature</p>
            <p class="text-sm text-main/50">Icons now support 3 weights: light, regular, and bold.</p>
          </div>
        </div>
        
        <!-- Tags -->
        <div class="flex flex-wrap gap-3">
          <span class="inline-flex items-center gap-1 pl-2 pr-3 py-1 bg-secondary rounded-full text-xs uppercase">
            <span class="inline-flex size-3.5">${icons.filter}</span>
            Filter
          </span>
          <span class="inline-flex items-center gap-1 pl-2 pr-3 py-1 bg-secondary rounded-full text-xs uppercase">
            <span class="inline-flex size-3.5">${icons.archive}</span>
            Archive
          </span>
          <span class="inline-flex items-center gap-1 pl-2 pr-3 py-[calc(0.25rem-1px)] border border-border hover:bg-fg-secondary/20 text-fg/50 hover:text-fg cursor-pointer rounded-full text-xs uppercase">
            <span class="inline-flex size-3.5">${icons.plus}</span>
            Add Tag
          </span>
        </div>
      </div>
    </section>

  </main>
`,
    scriptInner: simplePageScripts,
  });

  await writeFile(join(DIST, 'examples.html'), html);
  console.log('  Generated examples.html');
}
