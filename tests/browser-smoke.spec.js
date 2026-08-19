const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173';

test.use({
  baseURL:BASE,
  channel:'chrome',
  serviceWorkers:'block',
  viewport:{width:390,height:844},
  screenshot:'only-on-failure',
  trace:'retain-on-failure'
});

function runtimeGuard(page){
  const pageErrors=[];
  const localAssetFailures=[];
  page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
  page.on('requestfailed',request=>{
    try{
      const url=new URL(request.url());
      if(url.origin===BASE&&['script','stylesheet'].includes(request.resourceType())){
        localAssetFailures.push(`${request.resourceType()} ${url.pathname}${url.search}: ${request.failure()?.errorText||'failed'}`);
      }
    }catch{}
  });
  return ()=>{
    expect(pageErrors,'uncaught browser exceptions').toEqual([]);
    expect(localAssetFailures,'failed local script/style requests').toEqual([]);
  };
}

async function stubExternalNetwork(page){
  await page.route('**/build-info.json',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify({version:'v0.5.16',sha:'1111111111111111111111111111111111111111',shortSha:'1111111',builtAt:'2026-08-19T00:00:00.000Z',runId:'browser-smoke'})
  }));
  await page.route('https://api.open-meteo.com/**',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify({
      timezone:'Asia/Ho_Chi_Minh',
      current:{time:'2026-08-19T12:00',temperature_2m:31,apparent_temperature:34,precipitation:0,rain:0,showers:0,weather_code:1,wind_speed_10m:9},
      daily:{temperature_2m_max:[34],temperature_2m_min:[27],precipitation_probability_max:[25],weather_code:[1]}
    })
  }));
  await page.route('https://geocoding-api.open-meteo.com/**',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify({results:[{name:'Ho Chi Minh City',admin1:'Ho Chi Minh',country:'Vietnam',latitude:10.7769,longitude:106.7009,timezone:'Asia/Ho_Chi_Minh'}]})
  }));
  await page.route('https://tran-closet-sync.jerryquinet.workers.dev/**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/health')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,service:'tran-closet-sync',features:{ai:true}})});
    return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'browser-smoke has no sync token'})});
  });
}

async function boot(page,lang='fr'){
  await stubExternalNetwork(page);
  await page.goto(`/?lang=${lang}`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#mainContent .hero-card')).toBeVisible();
  await expect(page.locator('#languageSwitch')).toBeVisible();
  await expect(page.locator(`#languageSwitch [data-lang="${lang}"]`)).toHaveClass(/active/);
}

test('core routes stay crash-free in French',async({page})=>{
  const assertRuntimeClean=runtimeGuard(page);
  await boot(page,'fr');
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await expect(page.locator('#pageTitle')).toContainText(/dressing/i);

  const search=page.locator('#searchInput');
  await expect(search).toBeVisible();
  await search.click();
  await search.pressSequentially('Melo',{delay:15});
  await expect(search).toHaveValue('Melo');
  await page.waitForTimeout(250);
  await page.keyboard.type('dy',{delay:15});
  await expect(search).toHaveValue('Melody');
  await expect(page.locator('.item-card:not([hidden])').first()).toBeVisible();

  await page.locator('.nav-item[data-route="add"]').click();
  await expect(page.locator('#itemForm')).toBeVisible();
  await expect(page.locator('[data-photo-camera]')).toBeVisible();
  await expect(page.locator('[data-photo-gallery]')).toBeVisible();
  await expect(page.locator('#photoInput')).not.toHaveAttribute('capture',/.+/);
  await expect(page.locator('#cameraInput')).toHaveAttribute('capture','environment');

  await page.locator('.nav-item[data-route="profile"]').click();
  await expect(page.locator('#syncConfigForm')).toBeVisible();
  await expect(page.locator('#syncDiagnostics')).toHaveCount(1);
  await expect(page.locator('#pageTitle')).toContainText('Profil');

  await page.locator('.nav-item[data-route="outfits"]').click();
  await expect(page.locator('#createOutfit')).toBeVisible();
  await expect(page.locator('.outfit-list')).toBeVisible();

  await page.locator('.nav-item[data-route="closet"]').click();
  await expect(page.locator('.daily-assistant-launch')).toBeVisible();
  await page.locator('.daily-assistant-launch').click();
  await expect(page.locator('#dailyAssistantDialog[open]')).toBeVisible();
  await expect(page.locator('[data-assistant-occasion]')).toBeVisible();
  await expect(page.locator('.assistant-weather')).toContainText('Open-Meteo');
  await page.locator('[data-assistant-close]').click();

  assertRuntimeClean();
});

test('FR and VI reload paths keep navigation renderable',async({page})=>{
  const assertRuntimeClean=runtimeGuard(page);
  await boot(page,'fr');
  await Promise.all([
    page.waitForURL(/\?lang=vi/),
    page.locator('#languageSwitch [data-lang="vi"]').click()
  ]);
  await expect(page.locator('#mainContent .hero-card')).toBeVisible();
  await expect(page.locator('#languageSwitch [data-lang="vi"]')).toHaveClass(/active/);
  await expect(page.locator('html')).toHaveAttribute('lang','vi');
  await expect(page.locator('#pageTitle')).toContainText('Tủ đồ');
  await page.locator('.nav-item[data-route="profile"]').click();
  await expect(page.locator('#pageTitle')).toContainText('Hồ sơ');
  await expect(page.locator('#syncConfigForm')).toBeVisible();
  assertRuntimeClean();
});
