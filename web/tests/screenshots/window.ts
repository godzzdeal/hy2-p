export const MACOS_WINDOW = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
:root{--desktop:#e9edf2;--chrome:#f7f8fa;--stroke:#d0d7df;--title:#48505d;--shadow:rgba(15,23,42,.22);--red:#ff5f57;--yellow:#febc2e;--green:#28c840}
@media(prefers-color-scheme:dark){:root{--desktop:#131b28;--chrome:#202a39;--stroke:#38475c;--title:#c5cfdd;--shadow:rgba(0,0,0,.4)}}
*{box-sizing:border-box}body{margin:0;padding:32px;background:var(--desktop);font-family:system-ui,sans-serif}
.window{height:calc(100vh - 64px);display:flex;flex-direction:column;border:1px solid var(--stroke);border-radius:16px;overflow:hidden;box-shadow:0 24px 64px var(--shadow)}
header{height:40px;flex-shrink:0;background:var(--chrome);position:relative;display:flex;align-items:center;justify-content:center;color:var(--title);font-size:14px;font-weight:500;border-bottom:1px solid var(--stroke)}
.dots{position:absolute;left:16px;display:flex;gap:8px}.dots i{display:block;width:12px;height:12px;border-radius:50%;background:var(--red)}.dots i:nth-child(2){background:var(--yellow)}.dots i:nth-child(3){background:var(--green)}
iframe{border:0;display:block;min-height:0;flex:1;width:100%}
</style></head><body><div class="window"><header><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>HY2-P</header><iframe src="http://panel.test/" title="HY2-P"></iframe></div></body></html>`;
