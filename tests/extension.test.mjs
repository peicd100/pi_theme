import test from'node:test';import assert from'node:assert/strict';import{mkdtemp,rm,readFile,writeFile}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';import{fileURLToPath}from'node:url';import{fromHost}from'./runtime.mjs';import{ThemeStore}from'../src/store_v0.1.0.mjs';
const {loadExtensions}=await fromHost('dist/core/extensions/loader.js');const {loadThemeFromPath}=await fromHost('dist/modes/interactive/theme/theme.js');const {visibleWidth}=await import('@earendil-works/pi-tui');const path=fileURLToPath(new URL('../extensions/index.ts',import.meta.url)),preset=fileURLToPath(new URL('../themes/pi-theme-docker-look.json',import.meta.url));
async function fixture(run){const root=await mkdtemp(join(tmpdir(),'theme 中文 UI ')),old=process.env.PI_CODING_AGENT_DIR;process.env.PI_CODING_AGENT_DIR=root;try{
 const result=await loadExtensions([path],root);assert.deepEqual(result.errors,[]);const extension=result.extensions[0],notices=[],setCalls=[],original=loadThemeFromPath(preset),store=new ThemeStore(root),choices=[],inputs=[];let theme=original;
 const ctx={mode:'tui',cwd:root,isIdle:()=>true,hasPendingMessages:()=>false,sessionManager:{getSessionId:()=> 'fixture',getSessionFile:()=> '/fixture.jsonl'},ui:{notify:text=>notices.push(text),get theme(){return theme;},setTheme:value=>{setCalls.push(value);if(typeof value==='string'){theme=loadThemeFromPath(store.path);return {success:true};}theme=value;return {success:true};},select:async()=>choices.shift(),input:async()=>inputs.shift(),confirm:async()=>true,custom:async factory=>{
 let done=false;const c=factory({requestRender:()=>{}},theme,{},()=>{done=true;});for(const width of[0,1,12,40,80])for(const line of c.render(width))assert(visibleWidth(line)<=width);c.handleInput('\u001b[C');c.handleInput('\r');assert(done);c.dispose();}}};
 await run({root,extension,store,ctx,notices,choices,inputs,setCalls,original,get theme(){return theme;},command:args=>extension.commands.get('pi-theme').handler(args??'',ctx)});
 }finally{if(old===undefined)delete process.env.PI_CODING_AGENT_DIR;else process.env.PI_CODING_AGENT_DIR=old;await rm(root,{recursive:true,force:true});}}
test('公開載入器只註冊中文指令，啟動不改主題或呼叫模型',()=>fixture(async f=>{
 assert.deepEqual([...f.extension.commands.keys()],['pi-theme']);assert.equal(f.extension.tools.size,0);assert.match(f.extension.commands.get('pi-theme').description,/中文/);for(const h of f.extension.handlers.get('session_start'))await h({},f.ctx);assert.equal(f.setCalls.length,0);assert.equal((await f.store.snapshot()).hash,null);
}));
test('實際彩色預覽可窄欄換頁，取消還原原本 Theme 物件且不保存',()=>fixture(async f=>{
 f.choices.push('預覽實際配色','取消離開');await f.command();assert.equal(f.theme,f.original);assert.equal((await f.store.snapshot()).hash,null);assert.equal(f.setCalls.length,2);assert.match(f.notices.at(-1),/未保存/);
}));
test('修改、確認保存、重開保留，設定與範本不覆蓋其他資料',()=>fixture(async f=>{
 const presetBefore=await readFile(preset);f.ctx.ui.select=async(_title,options)=>{const choice=f.choices.shift();return choice==='FIELD'?options.find(x=>x.includes('（accent）')):choice;};f.choices.push('調整顏色','FIELD','保存並套用');f.inputs.push('#a0f');await f.command();assert.equal((await f.store.read()).palette.colors.accent,'#AA00FF');assert.equal(f.theme.name,'pi-theme-user');assert.deepEqual(await readFile(preset),presetBefore);f.choices.push('取消離開');await f.command();assert.equal((await f.store.read()).palette.colors.accent,'#AA00FF');assert.match(f.notices.join('\n'),/保存並套用/);
}));
test('否認確認、無效色碼、非 TUI、忙碌與秘密參數不寫入',()=>fixture(async f=>{
 f.choices.push('保存並套用','取消離開');f.ctx.ui.confirm=async()=>false;await f.command();assert.equal((await f.store.snapshot()).hash,null);f.ctx.mode='sdk';await f.command();assert.match(f.notices.at(-1),/TUI/);f.ctx.mode='tui';f.ctx.isIdle=()=>false;await f.command();assert.match(f.notices.at(-1),/佇列/);await f.command('private-do-not-echo');assert(!f.notices.at(-1).includes('private-do-not-echo'));
}));
test('在等待對話選擇時切換 session，草稿不得保存',()=>fixture(async f=>{
 f.ctx.ui.select=async()=>{await f.extension.handlers.get('session_tree')[0]({},f.ctx);return '保存並套用';};await f.command();assert.equal((await f.store.snapshot()).hash,null);assert.match(f.notices.at(-1),/變更/);
}));
