import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const exactKeys = (value, keys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !keys.includes(key))) throw Error('Unsupported configuration');
};
const empty = value => isDeepStrictEqual(value, {});

// Deliberately NOT the FlowProof product engine or an n8n runtime.
// Accepts only a two-node Manual Trigger -> HTTP Request example with a literal JSON body.
export function runDemo(workflow, contract) {
  const requests = [];
  try {
    exactKeys(workflow, ['name', 'active', 'nodes', 'connections', 'settings']);
    if (workflow.active !== false || !isDeepStrictEqual(workflow.settings, {executionOrder:'v1'}) ||
        !Array.isArray(workflow.nodes) || workflow.nodes.length !== 2) throw Error('Only the inactive two-node example is supported');
    const [start, action] = workflow.nodes;
    for (const node of workflow.nodes) {
      exactKeys(node, ['id', 'name', 'type', 'typeVersion', 'position', 'parameters']);
      if (typeof node.name !== 'string' || !node.name || node.name.length > 100) throw Error('Invalid node name');
    }
    if (start.name === action.name || start.type !== 'n8n-nodes-base.manualTrigger' || start.typeVersion !== 1 ||
        !empty(start.parameters) || action.type !== 'n8n-nodes-base.httpRequest' || action.typeVersion !== 4.2) throw Error('Unsupported node or version');
    const expectedConnections = {[start.name]:{main:[[{node:action.name,type:'main',index:0}]]}};
    if (!isDeepStrictEqual(workflow.connections, expectedConnections)) throw Error('Unsupported graph');
    const p = action.parameters;
    exactKeys(p, ['method', 'url', 'sendBody', 'specifyBody', 'jsonBody', 'options']);
    if (p.method !== 'POST' || p.sendBody !== true || p.specifyBody !== 'json' || !empty(p.options) ||
        typeof p.jsonBody !== 'string' || p.jsonBody.length > 8192 || p.jsonBody.includes('{{')) throw Error('Only a literal POST JSON body is supported');
    const url = new URL(p.url);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.example.test') || url.username || url.password || url.hash || url.search || url.port) throw Error('Only synthetic example.test URLs are supported');
    const body = JSON.parse(p.jsonBody);
    exactKeys(body, ['leadId','email']);
    if (typeof body.leadId !== 'string' || !/^synthetic-[a-z0-9-]{1,50}$/.test(body.leadId) ||
        typeof body.email !== 'string' || !/^[a-z0-9.-]{1,40}@example\.test$/.test(body.email)) throw Error('Use synthetic fixture data only');
    exactKeys(contract, ['name','repeats','expectedRequestCount','mock']);
    if (typeof contract.name !== 'string' || contract.name.length > 150 || !Number.isInteger(contract.repeats) ||
        contract.repeats < 1 || contract.repeats > 10 || !Number.isInteger(contract.expectedRequestCount) ||
        contract.expectedRequestCount < 0 || contract.expectedRequestCount > 10) throw Error('Invalid test contract');
    exactKeys(contract.mock, ['status','body']);
    exactKeys(contract.mock.body, ['id']);
    if (contract.mock.status !== 200 || typeof contract.mock.body.id !== 'string' ||
        !/^synthetic-[a-z0-9-]{1,50}$/.test(contract.mock.body.id)) throw Error('A synthetic HTTP 200 mock is required');

    // In-memory transport only. No fetch, HTTP client, eval, subprocess or external side effects.
    const mockSend = request => {
      requests.push({...structuredClone(request), response:structuredClone(contract.mock), mocked:true});
      return structuredClone(contract.mock.body);
    };
    const output = [];
    for (let repetition = 1; repetition <= contract.repeats; repetition++) {
      output.push(mockSend({node:action.name,repetition,method:p.method,url:p.url,body}));
    }
    const passed = requests.length === contract.expectedRequestCount;
    return {
      mode:'narrow-offline-showcase',status:passed?'passed':'failed',gate:passed?'passed':'stopped',
      workflowHash:hash(workflow),contractHash:hash(contract),
      assertion:{type:'requestCount',expected:contract.expectedRequestCount,actual:requests.length,passed},
      requests,output,
      limitations:[
        'Not native n8n execution. Only this documented two-node subset is interpreted.',
        'Counts mocked attempts, not real message delivery or provider deduplication.',
        'No persistent deduplication store is present. Repeats reuse the same literal payload.',
        'Passing this test does not certify workflow correctness, security or production readiness.'
      ]
    };
  } catch {
    // Never let unsupported input satisfy an expected business failure.
    return {mode:'narrow-offline-showcase',status:'blocked',gate:'stopped',requests:[],error:'Input is outside the supported synthetic demo contract. Nothing was executed.'};
  }
}
export function renderReport(result) {
  const escape = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assertion = result.assertion;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FlowProof reproducible example</title>
  <style>body{margin:0;background:#0d1018;color:#f2f0fa;font:18px/1.6 system-ui,sans-serif}main{max-width:960px;margin:auto;padding:48px 24px}h1{font-size:44px;line-height:1.15}.tag{color:#b399ff}strong{color:#ff8ea5}table{border-collapse:collapse;width:100%;margin:28px 0}th,td{border-bottom:1px solid #3e4250;padding:15px;text-align:left}pre{padding:20px;background:#171c27;overflow:auto;font-size:14px}a{color:#b399ff}li{margin-bottom:8px}</style>
  <main><p class="tag">FlowProof / reproducible offline example</p><h1>A completed execution can still fail its business expectation.</h1><p>Observed result: <strong>${escape(result.status.toUpperCase())}</strong>. Gate: ${escape(result.gate)}.</p>
  ${assertion?`<table><tr><th>Assertion</th><th>Expected</th><th>Observed</th></tr><tr><td>Mocked welcome requests</td><td>${assertion.expected}</td><td>${assertion.actual}</td></tr></table>`:`<p>${escape(result.error)}</p>`}
  <h2>Scope matters</h2><ul>${(result.limitations??[]).map(x=>`<li>${escape(x)}</li>`).join('')}</ul>
  <h2>Generated execution evidence</h2><p>This JSON is produced by running the example. It is not a preloaded success/failure fixture.</p><pre>${escape(JSON.stringify(result,null,2))}</pre><p>Reproduce with <code>npm run demo</code>. Exit 1 is the intentional failed assertion. See README.md.</p></main></html>`;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const workflow = JSON.parse(await readFile(new URL('./examples/welcome.workflow.json',import.meta.url),'utf8'));
    const contract = JSON.parse(await readFile(new URL('./examples/repeated-delivery.case.json',import.meta.url),'utf8'));
    const result = runDemo(workflow,contract);
    const dir = new URL('./reports/',import.meta.url);
    await mkdir(dir,{recursive:true});
    await writeFile(new URL('demo.json',dir),JSON.stringify(result,null,2)+'\n');
    await writeFile(new URL('demo.html',dir),renderReport(result));
    console.log(JSON.stringify({status:result.status,gate:result.gate,assertion:result.assertion},null,2));
    process.exitCode = result.status==='passed'?0:result.status==='failed'?1:2;
  } catch (error) { console.error('Demo input or report writing failed:',error.message);process.exitCode=2; }
}
