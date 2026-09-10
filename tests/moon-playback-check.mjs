import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 for(const viewport of [{width:440,height:956},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));

  await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173')+'/moon.html');
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.journeyProgress==='1.0000');
  const play=page.locator('.ex-play'),canvas=page.locator('canvas');
  const before=+(await canvas.getAttribute('data-camera-distance'));
  await play.click();assert.equal(await play.getAttribute('aria-pressed'),'true');
  await page.waitForFunction(()=>document.querySelector('canvas').dataset.moonChapter==='1',null,{timeout:1500});
  await page.waitForFunction(before=>+document.querySelector('canvas').dataset.cameraDistance<before-.1,before,{timeout:2500});
  await play.click();await page.waitForTimeout(12500);assert.equal(await canvas.getAttribute('data-moon-chapter'),'1','Pause holds the chapter');
  await play.click();await page.waitForTimeout(300);assert.equal(await canvas.getAttribute('data-moon-chapter'),'1','Resume does not skip a chapter');
  await page.waitForFunction(()=>document.querySelector('canvas').dataset.moonChapter==='2',null,{timeout:14000});
  assert.deepEqual(errors,[]);console.log(`${viewport.width}: immediate Moon playback, camera motion, pause and resume passed`);await page.close();
 }
}finally{await browser.close();}
