const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function captureAll() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. Login page
  console.log('Capturing Login...');
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '01_login.png') });

  // Click preset Admin button to populate form
  console.log('Logging in as Admin...');
  const presetAdmin = await page.$('#presetAdminBtn');
  if (presetAdmin) {
    await presetAdmin.click();
    await new Promise(r => setTimeout(r, 300));
  } else {
    await page.type('#screenLoginUsername', 'admin');
    await page.type('#screenLoginPassword', 'admin123');
  }

  const submitBtn = await page.$('#screenLoginForm button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 2500));
  }

  // List of pages to capture
  const routes = [
    { name: '02_dashboard', path: '/dashboard', wait: 2500 },
    { name: '03_departments', path: '/departments', wait: 1500 },
    { name: '04_employees', path: '/employees', wait: 1500 },
    { name: '06_projects', path: '/projects', wait: 1500 },
    { name: '07_resources', path: '/resources', wait: 1500 },
    { name: '08_leave', path: '/leave', wait: 1500 },
    { name: '09_payroll', path: '/payroll', wait: 1500 },
    { name: '10_performance', path: '/performance', wait: 1500 },
    { name: '11_skills', path: '/skills', wait: 1500 },
    { name: '12_positions', path: '/positions', wait: 1500 },
    { name: '13_recruitment', path: '/recruitment', wait: 1500 },
    { name: '14_assets', path: '/assets', wait: 1500 },
    { name: '15_training', path: '/training', wait: 1500 },
    { name: '16_profile', path: '/profile', wait: 1500 },
  ];

  for (const r of routes) {
    console.log(`Capturing ${r.name} (${r.path})...`);
    await page.goto('http://localhost:5000' + r.path, { waitUntil: 'networkidle0' });
    await new Promise(res => setTimeout(res, r.wait));
    await page.screenshot({ path: path.join(outDir, `${r.name}.png`) });
  }

  // Also capture employee modal
  console.log('Capturing modal employee...');
  await page.goto('http://localhost:5000/employees', { waitUntil: 'networkidle0' });
  await new Promise(res => setTimeout(res, 1500));
  const addBtn = await page.$('#openAddModalBtn, #addEmployeeBtn, .btn-primary');
  if (addBtn) {
    await addBtn.click();
    await new Promise(res => setTimeout(res, 800));
    await page.screenshot({ path: path.join(outDir, '05_modal_employee.png') });
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureAll().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
