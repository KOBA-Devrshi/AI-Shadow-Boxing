import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function getWebviewHtml(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
  try {
    return fs.readFileSync(htmlPath, 'utf-8');
  } catch {
    return `<html><body style="background:#000;color:#00ff88;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh">
      <div style="text-align:center">
        <div style="font-size:40px;font-weight:900">AI SHADOW BOXING</div>
        <div style="margin-top:20px;color:#444">webview.html not found next to extension.ts</div>
      </div></body></html>`;
  }
}

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined;
  let statusBar: vscode.StatusBarItem | undefined;

  const startCmd = vscode.commands.registerCommand('aiShadowBoxing.start', () => {
    if (panel) { panel.reveal(vscode.ViewColumn.One); return; }

    panel = vscode.window.createWebviewPanel(
      'aiShadowBoxing', '🥊 AI Shadow Boxing', vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [context.extensionUri] }
    );

    let html = getWebviewHtml(context);
    // Patch CSP for camera + scripts
    html = html.replace('<meta charset="UTF-8">',
      `<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src blob: data:; media-src blob: mediastream:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">`);
    panel.webview.html = html;

    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.text = '$(zap) Shadow Boxing';
    statusBar.color = '#00ff88';
    statusBar.command = 'aiShadowBoxing.start';
    statusBar.show();

    panel.webview.onDidReceiveMessage((msg) => {
      if (msg.command === 'roundEnd')
        vscode.window.setStatusBarMessage(`$(zap) Round ${msg.round} — ${msg.punches} punches!`, 3000);
      if (msg.command === 'workoutDone')
        vscode.window.showInformationMessage(`🥊 Done! ${msg.total} punches, ${msg.combos} combos. Great session!`);
      if (msg.command === 'cameraDenied')
        vscode.window.showWarningMessage('Camera denied — using keyboard mode (J/C/H/U/B/S).');
    }, undefined, context.subscriptions);

    panel.onDidDispose(() => { panel = undefined; statusBar?.dispose(); }, null, context.subscriptions);
  });

  const stopCmd = vscode.commands.registerCommand('aiShadowBoxing.stop', () => {
    panel ? panel.dispose() : vscode.window.showInformationMessage('No session running.');
  });

  context.subscriptions.push(startCmd, stopCmd);
  vscode.window.showInformationMessage('🥊 AI Shadow Boxing ready! Press Ctrl+Shift+B to start.', 'Start Now')
    .then(c => { if (c === 'Start Now') vscode.commands.executeCommand('aiShadowBoxing.start'); });
}

export function deactivate() {}
