import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
const fixture=new URL('../output/browser-check/package.json',import.meta.url);
const requireBrowser=createRequire(existsSync(fixture)?fixture:new URL('../package.json',import.meta.url));
export const {chromium}=requireBrowser('playwright');
