import Koa from 'koa';
import KoaRouter from '@koa/router';
import Prometheus from 'prom-client';

const http = new Koa();
const httpRouter = new KoaRouter();

export const serverGauge = new Prometheus.Gauge({
    name: 'server_count',
    help: 'server_count_help'
})

export const search_found = new Prometheus.Counter({
    name: 'search_found',
    help: 'search_found_help'
});

export const search_notFound = new Prometheus.Counter({
    name: 'search_notFound',
    help: 'search_notFound_help'
});

export const search_errored = new Prometheus.Counter({
    name: 'search_errored',
    help: 'search_errored_help'
});

export const cache_hits = new Prometheus.Counter({
    name: 'cache_hits',
    help: 'cache_hits_help',
    labelNames: ['api']
});

export const cache_misses = new Prometheus.Counter({
    name: 'cache_misses',
    help: 'cache_misses_help',
    labelNames: ['api'],
});



httpRouter.get('/metrics', async ctx => {
    ctx.body = await Prometheus.register.metrics()
});

http.use(httpRouter.routes())

http.listen(3000);
