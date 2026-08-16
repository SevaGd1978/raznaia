# raznaia · СчётМастер

Веб-модуль счетов с входом, регистрацией и админ-паролем.

## Доступ из России

Ссылки Cloudflare (`*.trycloudflare.com`) из РФ часто **не открываются**.  
Актуальные рабочие адреса — в [`invoice-app/ACCESS.md`](invoice-app/ACCESS.md).

Постоянный хостинг:  
https://render.com/deploy?repo=https://github.com/SevaGd1978/raznaia

```bash
cd invoice-app
cp .env.example .env
npm install
npm run build
npm start
```

- Админ: логин `admin`, пароль из `ADMIN_PASSWORD`
- Нормочасы, запчасти, НДС (вкл/выкл + %), номер авто
