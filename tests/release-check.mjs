import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--enable-webgl','--ignore-gpu-blocklist']});
try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))external.push(r.url());});
 for(const path of ['/','/moon.html']){
  await page.goto(base+path);await page.waitForSelector('.ready');if(path.includes('moon'))await page.waitForFunction(()=>document.querySelector('canvas').dataset.journeyProgress==='1.0000');
  assert.equal(await page.locator('.desktop-navigation a').count(),3);assert.equal(await page.locator('[data-chapter]').count(),4);
  assert.doesNotMatch(await page.locator('body').innerText(),/Apollo|Civilization|History|Surveyor|Chandrayaan|Chang’e/);
  await page.screenshot({path:`/tmp/release-${path==='/'?'earth':'moon'}-${viewport.width}.png`});
  const c=page.locator('canvas');const before=+await c.getAttribute('data-camera-distance');await page.locator('#ex-in').click();await page.waitForTimeout(900);assert.ok(+await c.getAttribute('data-camera-distance')<before-.05);
  if(viewport.width<760)await page.locator('#mobile-panel-toggle').click();
  await page.locator('[data-chapter="2"]').click();if(viewport.width<760)await page.locator('#mobile-panel-toggle').click();await page.locator('#ex-range').fill('0.8');await page.locator('#ex-range').dispatchEvent('input');
  if(viewport.width<760){await page.locator('#mobile-panel-toggle').click();await page.locator('#menu-toggle').click();await page.locator('#mobile-menu-sources').click();}else await page.locator('#nav-science').click();
  assert.ok(await page.locator('.ex-dialog').isVisible());await page.keyboard.press('Escape');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(viewport.width,'Earth and Moon: assets, controls, sources, clean navigation, and no external requests passed');await page.close();
}}finally{await browser.close();}
