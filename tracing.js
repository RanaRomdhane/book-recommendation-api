const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

// Create resource with service info
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'book-recommendation-api',
  [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
});

// Get OTLP endpoint from environment or use default
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

// Create trace exporter
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
});

// Create metric exporter
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
});

// Create metric reader
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60000, // Export metrics every 60 seconds
});

// Initialize the SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable fs instrumentation to reduce noise
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

// Start the SDK (synchronous in newer versions)
try {
  sdk.start();
  console.log('✅ OpenTelemetry tracing initialized');
} catch (error) {
  console.error('❌ Error initializing OpenTelemetry tracing:', error);
}

// Graceful shutdown
const shutdown = () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry tracing terminated'))
    .catch((error) => console.error('Error terminating OpenTelemetry tracing:', error))
    .finally(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);