import Koa from 'koa';
import KoaRouter from '@koa/router';
import Prometheus from 'prom-client';

const http = new Koa();
const httpRouter = new KoaRouter();

export const serverGauge = new Prometheus.Gauge({
    name: 'server_count',
    help: 'server_count_help'
})

httpRouter.get('/metrics', async ctx => {
    ctx.body = await Prometheus.register.metrics()
});

http.use(httpRouter.routes())

http.listen(3000);
