import{readFileSync}from'node:fs';
import{resolve}from'node:path';
import{getAgentDir,Theme,type ExtensionAPI}from'@earendil-works/pi-coding-agent';
import{VERSION,OWN_NAME,LABELS,validatePalette,editColor,themeParts}from'../src/palette_v0.1.0.mjs';
import{ThemeStore}from'../src/store_v0.1.0.mjs';
import{previewComponent}from'../src/preview.ts';

export default function themeEditor(pi:ExtensionAPI){
 const store=new ThemeStore(getAgentDir()),preset=validatePalette(JSON.parse(readFileSync(new URL('../themes/pi-theme-docker-look.json',import.meta.url),'utf8')));
 let active:AbortController|undefined,epoch=0;
 const invalidate=()=>{epoch++;active?.abort();};
 pi.on('session_start',invalidate);pi.on('session_tree',invalidate);pi.on('session_shutdown',invalidate);
 pi.registerCommand('pi-theme',{
  description:'中文配色編輯：範本、HEX、實際預覽、匯入匯出與確認保存；不呼叫模型',
  handler:async(args,ctx)=>{
   const notify=(text:string,kind:'info'|'warning'|'error'='info')=>ctx.ui.notify(text,kind);
   if(args.trim()){notify('用法：/pi-theme；以中文選單操作，不接受指令參數。','warning');return;}
   if(ctx.mode!=='tui'){notify('配色編輯需要 Pi 互動式 TUI；未修改任何設定。','warning');return;}
   if(active||!ctx.isIdle()||ctx.hasPendingMessages()){notify('請等工作與訊息佇列完成；一次只能開啟一個配色編輯器。','warning');return;}
   const controller=new AbortController();active=controller;const startEpoch=epoch,key=JSON.stringify([ctx.sessionManager.getSessionId(),ctx.sessionManager.getSessionFile()??ctx.cwd]);
   const live=()=>!controller.signal.aborted&&epoch===startEpoch&&ctx.isIdle()&&!ctx.hasPendingMessages()&&JSON.stringify([ctx.sessionManager.getSessionId(),ctx.sessionManager.getSessionFile()??ctx.cwd])===key;
   const guard=()=>{if(!live())throw new Error('對話、工作或配色操作已變更；未繼續保存。');};
   const dialog={signal:controller.signal},original=ctx.ui.theme;
   const build=(palette:any,name='pi-theme-preview')=>{const {fg,bg,data}=themeParts(palette);return new Theme(fg,bg,original.getColorMode(),{name,appearance:data.appearance});};
   try{
    const saved=await store.read();guard();let draft=saved.palette??preset,expectedHash=saved.hash;
    notify(`配色編輯器 ${VERSION}：${saved.palette?'已讀取保存配色':'以內建 Docker 風格開始'}；確認保存前不改設定。`);
    const options=['調整顏色','預覽實際配色','載入內建範本／恢復預設','匯入主題 JSON','匯出草稿 JSON','保存並套用','取消離開'];
    while(live()){
     const choice=await ctx.ui.select('配色編輯（草稿未保存）',options,dialog);guard();if(!choice||choice==='取消離開'){notify('已離開編輯器；未保存草稿。');return;}
     if(choice==='調整顏色'){
      const keys=Object.keys(LABELS),labels=keys.map(k=>`${LABELS[k]}（${k}）`),picked=await ctx.ui.select('選擇配色項目',labels,dialog);guard();if(!picked)continue;const key=keys[labels.indexOf(picked)];if(!key)throw new Error('未知配色選項。');
      const current=draft.colors[key]??draft.export[key],value=await ctx.ui.input(`${LABELS[key]}：輸入 #RGB 或 #RRGGBB`,current,dialog);guard();if(value===undefined)continue;
      try{draft=editColor(draft,key,value);notify('草稿顏色已更新；尚未保存。');}catch{notify('色碼無效；請用 #RGB 或 #RRGGBB，草稿未改。','warning');}
     }else if(choice==='預覽實際配色'){
      const preview=build(draft);if(!ctx.ui.setTheme(preview).success)throw new Error('無法暫時套用預覽。');
      try{await ctx.ui.custom((tui,_theme,_keys,done)=>previewComponent(tui,preview,done,draft,controller.signal));}
      finally{if(ctx.ui.theme===preview)ctx.ui.setTheme(original);}guard();
     }else if(choice==='載入內建範本／恢復預設'){
      if(await ctx.ui.confirm('載入內建範本？','只替換編輯草稿；必須另行保存才會更改使用者配色。',dialog)){guard();draft=validatePalette(preset);notify('已載入內建範本至草稿。');}
     }else if(choice==='匯入主題 JSON'){
      const input=await ctx.ui.input('匯入檔案路徑（完整 HEX 配色 JSON）',undefined,dialog);guard();if(!input)continue;
      try{const imported=await store.import(resolve(ctx.cwd,input));guard();draft=imported;notify('主題已匯入草稿；尚未保存。');}catch(e){notify(e instanceof Error&&!(e as any).code&&/[\u3400-\u9fff]/.test(e.message)?e.message:'無法讀取匯入檔案；請檢查路徑、格式與權限。','warning');}
     }else if(choice==='匯出草稿 JSON'){
      const input=await ctx.ui.input('匯出新的 .json 檔案路徑（不覆寫既有檔案）',undefined,dialog);guard();if(!input)continue;
      if(!await ctx.ui.confirm('匯出草稿？','只建立指定的新檔案，不保存或套用目前主題。',dialog))continue;guard();
      try{await store.export(resolve(ctx.cwd,input),draft);notify('草稿已匯出；目前主題設定不變。');}catch{notify('無法匯出；目標須為不存在的新 .json 檔案，且目錄可寫。','warning');}
     }else if(choice==='保存並套用'){
      if(!await ctx.ui.confirm('保存並套用配色？','會保存 themes/pi-theme-user.json 並選用此主題；不修改套件範本、Windows Terminal 或其他設定。',dialog))continue;guard();
      const receipt=await store.save(draft,expectedHash,async palette=>{
       guard();const named=ctx.ui.setTheme(OWN_NAME);if(!named.success)throw new Error('主題檔案已回退；選用失敗，請以 /settings 檢查原本主題。');
       // Registered user themes may be cached until their watcher fires. Apply
       // the just-validated instance immediately; only the string call persists selection.
       const applied=ctx.ui.setTheme(build(palette,OWN_NAME));if(!applied.success)throw new Error('即時套用失敗；請以 /settings 檢查主題選擇。');
      },live);expectedHash=receipt.hash;notify('配色已保存並套用；插件更新不會覆蓋此使用者主題。');return;
     }
    }
   }catch(e){
    if(live()&&ctx.ui.theme.name===OWN_NAME)ctx.ui.setTheme(original);
    notify(e instanceof Error&&!(e as any).code&&/[\u3400-\u9fff]/.test(e.message)?e.message:'配色操作失敗；請檢查檔案與權限，未記錄私人內容。','error');
   }
   finally{if(active===controller)active=undefined;controller.abort();}
  },
 });
}
