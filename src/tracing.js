// src/tracing.js
'use strict';
const opentelemetry = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { SimpleSpanProcessor, BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

// Define service metadata
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'book-recommendation-api',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
});

// Initialize tracer
const provider = new NodeTracerProvider({ resource });

// Configure Jaeger exporter
const exporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces', // Jaeger collector endpoint
});

// Use batch processor for performance
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

// Export tracer for use in the app
const tracer = opentelemetry.trace.getTracer('book-recommendation-tracer');
module.exports = tracer;

console.log('✅ OpenTelemetry tracing initialized and exporting to Jaeger');
