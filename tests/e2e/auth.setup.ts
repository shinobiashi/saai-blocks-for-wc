import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, 'auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
	await page.goto('/wp-login.php');
	await page.fill('#user_login', 'admin');
	await page.fill('#user_pass', 'password');
	await page.click('#wp-submit');
	await page.waitForURL('**/wp-admin/**');
	await page.context().storageState({ path: authFile });
});
