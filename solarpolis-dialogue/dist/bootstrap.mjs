// Keep a failed module/resource load from leaving an unexplained empty screen.
document.getElementById('save-status').textContent='Loading conversation engine…';
try {
  await import('./app.mjs?release=meaning-2');
} catch (error) {
  document.getElementById('save-status').textContent='The sample could not open';
  const notice=document.getElementById('toast');
  notice.textContent=`Startup failed: ${error.message}`;
  notice.hidden=false;
  console.error(error);
}
