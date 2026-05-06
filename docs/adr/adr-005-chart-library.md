# ADR-005: Chart Library Selection

## Status
Accepted

## Context
The network device monitor required a charting library to visualise latency time-series data. The application needed to display historical ping results with:
- Responsive line charts showing latency trends over time
- Time-range selection (5 minutes, 1 hour, 24 hours)
- Interactive tooltips on hover
- Dynamic colour coding based on latency thresholds
- Smooth integration with React 18 and the existing component architecture

The evaluation occurred during Sprint 2 (16th-29th April 2026) alongside device management features, with final implementation in early Sprint 3 (6th May 2026) when the latency visualisation requirements became fully defined.

## Decision
Selected **Recharts 3.x** as the charting library for all latency visualisations.

## Consequences

### Positive
- **Native React integration** — Declarative JSX API matches React patterns, no imperative DOM manipulation required
- **Composability** — Mix and match components (LineChart, XAxis, Tooltip) to build custom chart layouts
- **Responsive by default** — ResponsiveContainer handles window resize automatically
- **Customisable tooltips** — CustomTooltip component provides full control over hover state presentation
- **Performance with data updates** — Efficient re-rendering when time-series data changes via useMemo
- **TypeScript definitions included** — First-class type support without additional @types packages

### Negative
- **Bundle size** — ~450KB including D3 dependencies, heavier than lightweight alternatives
- **SVG-based only** — No Canvas rendering option for extremely large datasets (10k+ points)
- **Learning curve** — D3-based API concepts (scales, domains) require documentation reading
- **Limited animation control** — isAnimationActive={false} needed to prevent jarring updates with frequent data changes

## Alternatives Considered

| Library | Why Rejected |
|---------|--------------|
| **Chart.js 4.x** | Excellent performance and Canvas rendering, but React integration requires wrapper library (react-chartjs-2). Imperative update API conflicts with React's declarative model. |
| **Victory** | Purpose-built for React with elegant API, but slower development cycle and smaller community. Bundle size comparable to Recharts. |
| **D3 directly** | Maximum flexibility, but significant learning curve and verbose code for standard charts. Would require custom React integration. |
| **ApexCharts** | Feature-rich with good React wrapper, but heavier bundle (~500KB+) and opinionated styling harder to override. |
| **Nivo** | Beautiful pre-built components, but less control over low-level chart elements. Heavier dependency tree. |

## Related Decisions
- ADR-003: React 18 (Recharts is React-specific)
- ADR-006: Vite (tree-shaking removes unused Recharts components)
- Theme store integration for dynamic colour switching based on latency thresholds

## Implementation Notes

LatencyChart component implements:
- **Time-range filtering** — useMemo filters raw ping history by selected window (5min/1hr/24hr)
- **Dynamic colour coding** — Line stroke colour changes based on average latency (green/yellow/orange/red)
- **Custom tooltip** — Displays formatted timestamp and latency with colour-coded status
- **Responsive container** — Charts resize automatically with parent container
- **Performance optimisation** — isAnimationActive={false} prevents animation overhead during frequent data updates

Chart configuration:
```javascript
<LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="time" interval="preserveStartEnd" />
  <YAxis label={{ value: 'Latency (ms)', angle: -90 }} />
  <Tooltip content={<CustomTooltip />} />
  <Line type="monotone" dataKey="latency" stroke={lineColour} dot={false} isAnimationActive={false} />
</LineChart>
```

## References
- `src/renderer/components/LatencyChart.jsx` — Latency visualisation component with Recharts
- `package.json` — recharts ^3.8.1 in dependencies
- `src/renderer/App.css` — Chart styling including tooltip and container styles
- Recharts documentation: https://recharts.org/

---

**Decision Date:** 6th May 2026  
**Decided By:** Development Team  
**Last Updated:** 6th May 2026  
**Verified:** Recharts ^3.8.1 in package.json; LatencyChart.jsx implements LineChart with time-range filtering
