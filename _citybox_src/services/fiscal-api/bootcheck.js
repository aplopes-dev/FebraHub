const fs = require('fs');
process.env.FISCAL_CERT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:5432/x?schema=fiscal';
(async () => {
  let msg;
  try {
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    const s = app.getHttpAdapter().getInstance();
    const rotas = s._router.stack.filter(l => l.route)
      .map(l => Object.keys(l.route.methods)[0].toUpperCase() + ' ' + l.route.path)
      .filter(r => r.indexOf('nfce') >= 0 || r.indexOf('csc') >= 0);
    msg = 'OK ' + rotas.length + ' rotas: ' + rotas.join(' | ');
    await app.close();
  } catch (e) { msg = 'DI FALHOU: ' + (e && e.message); }
  fs.writeFileSync('bootlog.txt', msg);
})();
