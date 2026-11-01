/**
 * @name Character Visual Picker
 * @description Adds a searchable visual skin and trail picker to CharacterCustomization settings.
 * @author jonathan+codex
 * @version 1.2.0
 */

const skins = [...new Set(`dayOne echoAgent stripeDoubleGreen mustache vortexAgent fox pumpkin galaxy clown rainbowWave shark dragon axolotlPink axolotlBlue axolotlYellow golden detective catYellow catPink catBlue ant elementalMythic 8bitPixelMythic bigEye dogInu atlasOsaka 8bitWater mummy tombstone cauldron dogMilo moth bugPicasso catHalloween catStray potatoSack elementalElectricity frankengim atlasEiffel 8bitConstruction ghostCostume wraith spiderWeb dogDalmatian dogFinn mantis catLongHair starCat radish broccoli onion tomato bellPepper elementalLife elementalWater vampire elementalFire atlasColosseum atlasTajMahal 8bitCookie skeleton bonePattern dogGorgy dogRottweiler dogPug ladybug bugBlue catStripesGray truffle vegetablePattern_onion christmasBall candyCorn batPattern elementalEarth atlasPyramid atlasRushmore tourist 8bit 8bitMustache 8bitPurplePaste beetle blizzard wavesCalmSea grayGradient redNinja sprinklesRed redDeliciousApple sunny fadedBlueGradient glassHalfFull whiteAndBlueVerticalStripes polkaDotBlueAndYellow pinkPaste volcanoCracks mustachePink mountainAndSun camoTan redDinoCostume stripeDoubleRed coolRedBlueGradient pencilPack glyphsYellowBrown camoBlue purplePaste luchador rockyWest fifthBirthday corn feast pumpkinPie frostBuddy polkaDotWhiteAndRed festiveOnesieBlue festiveOnesieRed festiveOnesieGreen festiveOnesieTan gift hotChocolate snowman snowglobe mustacheSanta firework polkaDotFestiveReverse polkaDotFestive puzzleYellowPurple puzzleGreenBlue puzzleOrangeBlue puzzleGrayWhite puzzleRedGreen roses heart hamster leprechaun cellGold pirate constellationPurpleYellow constellationBlackGreen constellationBlackWhite constellationPinkGreen constellationYellowPink sketch astroHelmet mustacheBrown yinYang fisher coffee partyPineapple construction graduate graduateBlue stripeDoublePurple bananaSplit rockstar mountain tent goat daisy climber cookie zebra diamondRainbow circuitGreen circuitBlue circuitGray clock squiggles autumnTree crashTestDummy stripeDoubleYellow witch trickTreat calacaOne turkey farmer knight yellowCracksPurple arcticFox whistle penguinBlue goldenHotChocolate blastball blastballGimchester blastballKitcelona pufferJacket christmasTree rudolph snowball santaClaus causticWaterBlue causticWaterRed causticWaterGreen causticWaterCaribe causticWaterOcean causticWaterPurple taco gimKing sketchBlue camoGreen cellBlue burger sprinklesChocolate glyphsOrangeBlue frozenMummy evilPlantGreen evilPlantPink gamerGreen gamerPink gamerPurple gamerYellow sentryRobot redDino calacaTwo calacaThree yarn racoon pilot redPanda marshmallow discoBall incognito valenTime referee miningCart rainCloud watermelon terrainBlock floatingTube miner sproutingFlower luckyClover astroCaptain tuxedo blacksmith skeletonFluorescent weregim deadTree ghost elementalWind atlasAtlantis bee butterfly bugCustom dogGoldenRetrieverMythic catSiamese catStripesCustom carrot mushroom chiliPepper leek lettuce amanitaMuscaria`.split(' '))];
const trails = `origin_token fire_notes banana_peel rainbow_dots dust_particles bubble flowers metal_spring candy day_of_the_dead autumn_leaves corn hearts stars yin_yang puzzle_pieces taco blastball_phrases penguin_footprints blastball cupid_arrow birds mining_terrains beachball clovers easter_eggs bugs candy_corn cauldron evil_pumpkin tombstone skull spiders bat vegetables mushrooms pyramid camera honeycomb retro_fish retro_token dog_food dog_treat cat_toy yarn`.split(' ');
let favorites = api.storage.getValue('favorites', []);
if (!Array.isArray(favorites)) favorites = [];
let lastMode = 'skin';

api.UI.addStyles(`
  .cvp-panel { margin-top: 12px; border-top: 1px solid #ddd; padding-top: 10px; color:#25283a; }
  .cvp-controls { display:flex; gap:6px; flex-wrap:wrap; margin:6px 0; }
  .cvp-controls button, .cvp-controls input { border:1px solid #b8c0cc; border-radius:6px; padding:5px 8px; background:white; color:#25283a; }
  .cvp-controls input { min-width:140px; flex:1; }
  .cvp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(90px,1fr)); gap:7px; max-height:220px; overflow:auto; padding:2px; }
  .cvp-card { position:relative; display:flex; flex-direction:column; align-items:center; gap:2px; border:1px solid #d2d6df; border-radius:8px; background:#f4f6ff; padding:5px; min-width:0; }
  .cvp-choice { cursor:pointer; width:100%; border:0; background:transparent; color:#25283a; font-size:11px; overflow-wrap:anywhere; }
  .cvp-choice img { display:block; width:58px; height:58px; object-fit:contain; margin:auto; }
  .cvp-star { position:absolute; right:2px; top:1px; border:0; background:transparent; color:#aa7900; cursor:pointer; font-size:17px; }
  .cvp-status { font-size:12px; margin-top:6px; }
`);

function label(id) { return id.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'); }
function findDialog() {
  return [...document.querySelectorAll('[role="dialog"]')].find(d =>
    d.querySelector('[data-slot="dialog-header"]')?.textContent.trim() === 'Character Customization');
}
function installPicker(dialog) {
  if (dialog.querySelector('.cvp-panel')) return;
  const body = dialog.querySelector('.grow > div');
  if (!body) return;
  const panel = document.createElement('div');
  panel.className = 'cvp-panel';
  const heading = document.createElement('strong'); heading.textContent = 'Visual picker';
  const controls = document.createElement('div'); controls.className = 'cvp-controls';
  const skinButton = document.createElement('button'); skinButton.type='button'; skinButton.textContent='Gims';
  const trailButton = document.createElement('button'); trailButton.type='button'; trailButton.textContent='Trails';
  const favoriteButton = document.createElement('button'); favoriteButton.type='button'; favoriteButton.textContent='☆ Favorites';
  const search = document.createElement('input'); search.type='search'; search.placeholder='Search by name'; search.setAttribute('aria-label','Search cosmetics');
  controls.append(skinButton,trailButton,favoriteButton,search);
  const grid=document.createElement('div'); grid.className='cvp-grid';
  const status=document.createElement('div'); status.className='cvp-status'; status.textContent='Choose an image, then click Apply. Changes are visible only to you.';
  panel.append(heading, controls, grid, status); body.append(panel);
  let onlyFavorites = false;
  function choose(mode,id) {
    const select = body.querySelectorAll('select')[mode === 'skin' ? 0 : 1];
    if (!select) { status.textContent='Could not find the matching setting.'; return; }
    select.value='id'; select.dispatchEvent(new Event('change',{bubbles:true}));
    requestAnimationFrame(() => {
      const input=body.querySelector(mode === 'skin' ? 'input[placeholder="Skin ID"]' : 'input[placeholder="Trail ID"]');
      if (!input) { status.textContent='Choose Any by ID in the menu and try again.'; return; }
      input.value=id; input.dispatchEvent(new Event('input',{bubbles:true}));
      status.textContent=`Selected ${label(id)}. Click Apply to save.`;
      render();
    });
  }
  function render() {
    grid.replaceChildren();
    const query=search.value.trim().toLowerCase().replace(/\s/g,'');
    const entries=(lastMode==='skin'?skins:trails).filter(id=>id.toLowerCase().replace(/[_\s]/g,'').includes(query) && (!onlyFavorites || favorites.includes(lastMode+':'+id)));
    for (const id of entries) {
      const key=lastMode+':'+id, card=document.createElement('div'); card.className='cvp-card';
      const choice=document.createElement('button'); choice.type='button'; choice.className='cvp-choice'; choice.setAttribute('aria-label',`Choose ${label(id)}`);
      const img=document.createElement('img'); img.loading='lazy'; img.alt='';
      img.src=lastMode==='skin' ? `/assets/map/characters/spine/preview/${encodeURIComponent(id)}.png` : `/assets/map/trails/${encodeURIComponent(id)}/preview.png`;
      img.onerror=()=>{img.style.visibility='hidden';};
      const name=document.createElement('span'); name.textContent=label(id); choice.append(img,name); choice.addEventListener('click',()=>choose(lastMode,id));
      const star=document.createElement('button'); star.type='button'; star.className='cvp-star'; star.textContent=favorites.includes(key)?'★':'☆'; star.setAttribute('aria-label',`${favorites.includes(key)?'Remove':'Add'} ${label(id)} ${favorites.includes(key)?'from':'to'} favorites`);
      star.addEventListener('click',()=>{ favorites=favorites.includes(key)?favorites.filter(x=>x!==key):[...favorites,key]; api.storage.setValue('favorites',favorites); render(); });
      card.append(choice,star); grid.append(card);
    }
    if (!entries.length) { const empty=document.createElement('span'); empty.textContent='No matches'; grid.append(empty); }
    skinButton.style.fontWeight=lastMode==='skin'?'bold':'normal'; trailButton.style.fontWeight=lastMode==='trail'?'bold':'normal'; favoriteButton.textContent=onlyFavorites?'★ Favorites only':'☆ Favorites';
  }
  skinButton.onclick=()=>{lastMode='skin';render();}; trailButton.onclick=()=>{lastMode='trail';render();}; favoriteButton.onclick=()=>{onlyFavorites=!onlyFavorites;render();}; search.addEventListener('input',render);
  render();
}
function scan(){ const dialog=findDialog(); if(dialog) installPicker(dialog); }
const observer=new MutationObserver(scan); observer.observe(document.body,{childList:true,subtree:true}); scan();
api.onStop(()=>{observer.disconnect();document.querySelectorAll('.cvp-panel').forEach(e=>e.remove());});
