// Node 24 test-only fallback: resolve source .js specifiers to their TypeScript files.
// Application builds continue to use Next/TypeScript normally.
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function resolve(specifier,context,nextResolve){
  if(specifier.endsWith('.js') && (specifier.startsWith('.')||specifier.startsWith('file:')) && context.parentURL){
    const candidate=new URL(specifier.replace(/\.js$/,'.ts'),context.parentURL);
    if(existsSync(fileURLToPath(candidate)))return nextResolve(candidate.href,context);
  }
  return nextResolve(specifier,context);
}
