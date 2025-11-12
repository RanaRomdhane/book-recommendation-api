// Initialize OpenTelemetry SDK for Node.js and export to Jaeger.
// Import this before application code (require it at top of server entrypoint).

'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const JAEGER_HOST = process.env.JAEGER_HOST || 'localhost';
const JAEGER_PORT = process.env.JAEGER_PORT ? Number(process.env.JAEGER_PORT) : 6832;

// Use Jaeger agent by default (UDP thrift). For collector use exporter endpoint.
const jaegerExporter = new JaegerExporter({
  host: JAEGER_HOST,
  port: JAEGER_PORT,
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  // optional: service name can be set via OTEL_RESOURCE_ATTRIBUTES or here.
});

sdk.start()
  .then(() => {
    // Tracing started
    // console.log('OpenTelemetry SDK started');
  })
  .catch((err) => {
    console.error('Error starting OpenTelemetry SDK', err);
  });

// Ensure graceful shutdown of SDK on process termination
const shutdownSdk = async () => {
  try {
    await sdk.shutdown();
  } catch (err) {
    console.error('Error shutting down OpenTelemetry SDK', err);
  } finally {
    // do not exit here; server will manage exit
  }
};

process.on('SIGTERM', shutdownSdk);
process.on('SIGINT', shutdownSdk);
