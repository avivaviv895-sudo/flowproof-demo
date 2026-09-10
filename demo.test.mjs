import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runDemo,renderReport} from './demo.mjs';
const workflow=JSON.parse(readFileSync(new URL('./examples/welcome.workflow.json',import.meta.url)));
const contract=JSON.parse(readFileSync(new URL('./examples/repeated-delivery.case.json',import.meta.url)));
test('repeated execution observes two real in-memory calls and fails',()=>{
  const r=runDemo(workflow,contract);
  assert.equal(r.status,'failed');assert.equal(r.gate,'stopped');
  assert.equal(r.assertion.actual,2);assert.equal(r.requests.length,2);
  assert.deepEqual(r.requests.map(x=>x.repetition),[1,2]);
  assert.deepEqual(r.requests[0].body,JSON.parse(workflow.nodes[1].parameters.jsonBody));
});
test('single execution control passes without changing the assertion',()=>{
  const r=runDemo(workflow,{...contract,repeats:1});assert.equal(r.status,'passed');assert.equal(r.assertion.actual,1);
});
test('zero request expectation fails on an observed action',()=>{
  assert.equal(runDemo(workflow,{...contract,repeats:1,expectedRequestCount:0}).status,'failed');
});
test('evidence is deterministic and inputs are not mutated',()=>{
  const before=JSON.stringify({workflow,contract});
  assert.deepEqual(runDemo(workflow,contract),runDemo(workflow,contract));
  assert.equal(JSON.stringify({workflow,contract}),before);
});
for(const [name,mutate] of [
  ['missing mock',(_w,c)=>delete c.mock],
  ['real URL',w=>w.nodes[1].parameters.url='https://example.com/send'],
  ['credentials',w=>w.nodes[1].credentials={id:'example'}],
  ['unsupported node',w=>w.nodes[1].type='n8n-nodes-base.code'],
  ['unknown node version',w=>w.nodes[1].typeVersion=999],
  ['expression',w=>w.nodes[1].parameters.jsonBody='={{ $json }}'],
  ['graph change',w=>w.connections={}],
  ['extra setting',w=>w.nodes[1].parameters.options={timeout:10}],
  ['real personal data',w=>w.nodes[1].parameters.jsonBody='{"leadId":"synthetic-001","email":"someone@example.com"}'],
  ['unbounded repeats',(_w,c)=>c.repeats=1000]
]) test(`${name} blocks before any request`,()=>{
  const w=structuredClone(workflow),c=structuredClone(contract);mutate(w,c);
  const r=runDemo(w,c);assert.equal(r.status,'blocked');assert.equal(r.gate,'stopped');assert.deepEqual(r.requests,[]);
});
test('report escapes untrusted text',()=>{
  const html=renderReport({status:'blocked',gate:'stopped',error:'<script>alert(1)</script>'});
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});
