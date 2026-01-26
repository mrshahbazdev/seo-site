import { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Code, RefreshCw } from 'lucide-react';

export default function SchemaValidator({ page }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    let schemas = [];

    // Helper to add valid schemas
    const addSchema = (data) => {
        if (!data) return;
        if (Array.isArray(data)) {
            // Filter out nulls/empties
            data.forEach(item => {
                if (item) schemas.push(item);
            });
        } else if (typeof data === 'object') {
            schemas.push(data);
        }
    };

    // 1. Check Root Level properties (Directly from DB column)
    addSchema(page.json_ld);
    addSchema(page.microdata);

    // 2. Check raw_data (API Response)
    if (page.raw_data) {
        addSchema(page.raw_data.json_ld);
        addSchema(page.raw_data.microdata);

        // Sometimes it's nested in meta?
        if (page.raw_data.meta) {
            addSchema(page.raw_data.meta.microdata);
            addSchema(page.raw_data.meta.schema); // Unusual but possible
        }
    }

    // 3. Check Deep Analysis Data (Live Fetch)
    // This is critical for catching dynamically injected schemas
    if (page.analysis_data?.json_ld) {
        addSchema(page.analysis_data.json_ld);
    }

    // Deduplicate schemas based on strict JSON string matching
    // (To avoid showing the same schema twice if it appears in both raw_data and analysis_data)
    const uniqueSchemas = [];
    const seenSchemas = new Set();

    schemas.forEach(s => {
        try {
            const str = JSON.stringify(s);
            if (!seenSchemas.has(str)) {
                seenSchemas.add(str);
                uniqueSchemas.push(s);
            }
        } catch (e) {
            // If circular structure or error, just push it
            uniqueSchemas.push(s);
        }
    });

    schemas = uniqueSchemas;

    // Fallback: Check if checks indicate schema presence but we missed the payload
    const hasSchemaCheck = page.checks?.is_microdata || page.checks?.is_schema;

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const googleTestUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(page.url)}`;

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={18} /> Schema & Structured Data
                    {page.analysis_data && (
                        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                            Deep Scan Data
                        </span>
                    )}
                </h3>
                <a
                    href={googleTestUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                    Validate in Google <ExternalLink size={14} />
                </a>
            </div>

            {schemas.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {schemas.map((schema, index) => {
                        const type = schema['@type'] || schema['type'] || 'Unknown Type';
                        const context = schema['@context'] || 'Schema.org';

                        return (
                            <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <div
                                    onClick={() => toggleExpand(index)}
                                    style={{
                                        padding: '12px 16px',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ color: '#166534' }}><CheckCircle size={16} /></div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{type}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{context}</div>
                                        </div>
                                    </div>
                                    {expandedIndex === index ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                                </div>
                                {expandedIndex === index && (
                                    <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                                        <div style={{ position: 'relative' }}>
                                            <pre style={{
                                                fontSize: '12px',
                                                fontFamily: 'monospace',
                                                background: '#1e293b',
                                                color: '#e2e8f0',
                                                padding: '16px',
                                                borderRadius: '6px',
                                                overflowX: 'auto',
                                                margin: 0
                                            }}>
                                                {JSON.stringify(schema, null, 2)}
                                            </pre>
                                            <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#64748b', fontSize: '10px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <Code size={12} /> JSON-LD
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ padding: '20px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'start' }}>
                    <AlertCircle size={20} color="#d97706" style={{ marginTop: '2px' }} />
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>No Structured Data Found</div>
                        <div style={{ fontSize: '13px', color: '#b45309', lineHeight: '1.5' }}>
                            We couldn't detect any structured data in the initial crawl.
                            <br /><br />
                            <b>Tip:</b> Try running the <b>"Deep Analysis"</b> sidebar tool. It performs a live extraction of JSON-LD scripts that might have been missed.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
